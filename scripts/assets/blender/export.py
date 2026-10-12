# Blender 側の実行口（scripts/assets/build-blender.mjs から呼ばれる。直接は使わない）。
#
#   Blender --background --factory-startup --python-exit-code 1 \
#     --python scripts/assets/blender/export.py -- --model <assets-src/blender/<name>.py> --out <tmp.glb>
#
# 1. 空のシーンを作り、モデルスクリプトの build(ctx) を呼んでオブジェクトを作らせる
# 2. メッシュごとにライトマップ用 UV（2 番目の UV マップ "lightmap" → glTF の TEXCOORD_1）を作る
# 3. メッシュと空オブジェクト（階層・ピボット）を glb に書き出す（LOD・圧縮は Node 側で行う）。
#    `_` で始まる点属性はカスタム属性として出る（export_attributes）
#
# models.mjs の `input` があるモデルは、Node 側が作った入力ファイルのパスを ctx["input"] で受け取る。
#
# 決定性: 乱数はモデルスクリプトに渡す random.Random(seed) だけを使う。--factory-startup で
# ユーザー設定・アドオンの影響を受けない。
import argparse
import importlib.util
import math
import random
import sys

import bpy


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--model", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--seed", type=int, default=1)
    p.add_argument("--input", default=None)
    return p.parse_args(argv)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.textures, bpy.data.images):
        for item in list(block):
            block.remove(item)


def add_lightmap_uv(obj, margin):
    """2 番目の UV マップ "lightmap" を作り、重なりのない配置にする（#323 の GI ベイク用）。

    描画用 UV（1 番目）の島をそのまま複製し、回転・拡縮して 0..1 に詰め直す。島を細切れにしない
    （lightmap_pack は面ごとに島を分けるので、全辺が継ぎ目になり LOD の簡略化が効かなくなる）。
    描画用 UV が無ければ smart_project で作る。
    """
    mesh = obj.data
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    if len(mesh.uv_layers) == 0:
        bpy.ops.object.mode_set(mode="OBJECT")
        mesh.uv_layers.new(name="UVMap")
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.01)
    bpy.ops.object.mode_set(mode="OBJECT")
    lm = mesh.uv_layers.get("lightmap") or mesh.uv_layers.new(name="lightmap")  # 新しい層は active の複製
    mesh.uv_layers.active = lm
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.select_all(action="SELECT")
    bpy.ops.uv.pack_islands(rotate=True, margin=margin)
    bpy.ops.object.mode_set(mode="OBJECT")
    # glTF の TEXCOORD_0 は描画用（active_render）。lightmap は 2 番目として出る
    mesh.uv_layers[0].active_render = True
    mesh.uv_layers.active = mesh.uv_layers[0]


def main():
    args = parse_args()
    reset_scene()

    spec = importlib.util.spec_from_file_location("asset_model", args.model)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    ctx = {"bpy": bpy, "rng": random.Random(args.seed), "input": args.input}
    module.build(ctx)

    meshes = sorted((o for o in bpy.context.scene.objects if o.type == "MESH"), key=lambda o: o.name)
    if not meshes:
        raise RuntimeError("model created no mesh objects")
    margin = float(getattr(module, "LIGHTMAP_MARGIN", 0.01))
    for obj in meshes:
        add_lightmap_uv(obj, margin)

    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        if obj.type in ("MESH", "EMPTY"):
            obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=args.out,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_extras=True,
        export_attributes=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_animations=False,
    )


main()
