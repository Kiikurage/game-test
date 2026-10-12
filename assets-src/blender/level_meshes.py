# レベル形状のベイク（#329）。TS の生成コード（src/render/levelMeshes/levelMeshes.bake.ts）が作った
# 形状の木（serializeBakedScene の JSON。ctx["input"] のパス）を、そのまま Blender のオブジェクトに組み直す。
#
# - three の座標（+Y 上）→ Blender（+Z 上）: (x, y, z) → (x, -z, y)。glb 書き出しで +Y 上に戻る
# - position / normal 以外の属性は `_<名前>` の点属性（glb のカスタム属性。座標変換しない）。
#   `uv` は描画用 UV（TEXCOORD_0）
# - Group は空オブジェクト。名前（GLTFLoader が ':' を落とすので extras.bakedName にも）と userData（JSON）を
#   カスタムプロパティで持たせる
import array
import base64
import json

from mathutils import Matrix

# 面が数万ある大きなメッシュなので、島の間隔は小さめ
LIGHTMAP_MARGIN = 0.002

_C = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))


def _floats(s):
    return array.array("f", base64.b64decode(s))


def _uints(s):
    return array.array("I", base64.b64decode(s))


def _to_z_up(values):
    out = array.array("f", values)
    out[1::3] = array.array("f", (-v for v in values[2::3]))
    out[2::3] = values[1::3]
    return out


def _mesh(bpy, name, spec):
    attrs = spec["attributes"]
    pos = _to_z_up(_floats(attrs["position"]["data"]))
    idx = _uints(spec["index"])
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(pos) // 3)
    me.vertices.foreach_set("co", pos)
    me.loops.add(len(idx))
    me.loops.foreach_set("vertex_index", idx)
    tris = len(idx) // 3
    me.polygons.add(tris)
    me.polygons.foreach_set("loop_start", array.array("i", range(0, tris * 3, 3)))
    me.update()
    if "normal" in attrs:
        n = _to_z_up(_floats(attrs["normal"]["data"]))
        me.normals_split_custom_set_from_vertices([tuple(n[i : i + 3]) for i in range(0, len(n), 3)])
    for key in sorted(attrs):
        if key in ("position", "normal"):
            continue
        a = attrs[key]
        data = _floats(a["data"])
        if key == "uv":
            layer = me.uv_layers.new(name="UVMap")
            per_loop = array.array("f")
            for v in idx:
                per_loop.append(data[v * 2])
                per_loop.append(data[v * 2 + 1])
            layer.data.foreach_set("uv", per_loop)
            continue
        kind, prop = {1: ("FLOAT", "value"), 2: ("FLOAT2", "vector"), 3: ("FLOAT_VECTOR", "vector")}[a["itemSize"]]
        me.attributes.new("_" + key, kind, "POINT").data.foreach_set(prop, data)
    return me


def build(ctx):
    bpy = ctx["bpy"]
    with open(ctx["input"], encoding="utf8") as f:
        nodes = json.load(f)["nodes"]
    objs = []
    for n in nodes:
        data = _mesh(bpy, n["name"], n["mesh"]) if "mesh" in n else None
        obj = bpy.data.objects.new(n["name"], data)
        bpy.context.scene.collection.objects.link(obj)
        if obj.name != n["name"]:
            raise RuntimeError(f"name clash: {n['name']}")
        obj["bakedName"] = n["name"]
        if "mesh" in n:
            # glb のカスタム属性名は大文字になる（_WALLS）ので、元の綴りを残す
            custom = [k for k in sorted(n["mesh"]["attributes"]) if k not in ("position", "normal", "uv")]
            if custom:
                obj["bakedAttributes"] = json.dumps(custom)
            # 法線の無いメッシュ（炎・蜘蛛の巣の板）にも glb は法線を出すので、読み込み側で捨てる
            if "normal" not in n["mesh"]["attributes"]:
                obj["bakedNoNormal"] = True
            # 描画用 UV の無いメッシュは、ライトマップ UV の元に smart_project した TEXCOORD_0 を Node 側で捨てる
            if "uv" not in n["mesh"]["attributes"]:
                obj["dropTexcoord0"] = True
        if "userData" in n:
            obj["userData"] = n["userData"]
        m = n["matrix"]
        local = Matrix([[m[c * 4 + r] for c in range(4)] for r in range(4)])
        if n["parent"] >= 0:
            obj.parent = objs[n["parent"]]
        obj.matrix_basis = _C @ local @ _C.inverted()
        objs.append(obj)
