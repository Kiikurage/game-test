# サンプル: 折れた溝彫りの石柱（#327 のパイプライン確認用。原点 = 台座の底面中心、+Z 上、単位 m）。
#
# Blender パイプライン（scripts/assets/build-blender.mjs）のモデルスクリプトの書式:
#   build(ctx)   ctx["bpy"] = bpy、ctx["rng"] = random.Random(seed)。シーンにメッシュオブジェクトを作る。
#                オブジェクト名がそのまま glb のノード名（= LOD のベース名）になる。
#   LIGHTMAP_MARGIN（任意）  ライトマップ UV の島の間隔（uv.pack_islands の margin。既定 0.01）
# 乱数は ctx["rng"] だけを使う（決定性のため。random モジュールの既定の乱数や時刻を使わない）。
import math

import bmesh

LIGHTMAP_MARGIN = 0.01

RADIUS = 0.32
HEIGHT = 2.4
FLUTES = 20
SEGMENTS_AROUND = FLUTES * 6
RINGS = 72
BREAK_LOW = 1.75  # 折れ口の最も低い高さ
BREAK_HIGH = 2.3


def _material(bpy, name, color, roughness):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def _shaft_profile(angle):
    """溝彫りの断面半径（溝は浅い円弧）。"""
    phase = (angle * FLUTES / (2 * math.pi)) % 1.0
    return RADIUS * (1.0 - 0.045 * math.sin(phase * math.pi) ** 2)


def _build_shaft(bpy, rng):
    # 折れ口の高さ: 周方向に滑らかなうねり + ぎざぎざ
    k1, k2 = rng.uniform(0, 2 * math.pi), rng.uniform(0, 2 * math.pi)
    jag = [rng.uniform(-0.025, 0.025) for _ in range(SEGMENTS_AROUND)]
    tops = []
    for i in range(SEGMENTS_AROUND):
        a = 2 * math.pi * i / SEGMENTS_AROUND
        t = 0.5 + 0.35 * math.sin(a + k1) + 0.15 * math.sin(3 * a + k2)
        tops.append(BREAK_LOW + (BREAK_HIGH - BREAK_LOW) * t + jag[i])
    # 表面の欠け・風化（低周波のへこみ）
    dents = [
        (rng.uniform(0, 2 * math.pi), rng.uniform(0.3, BREAK_LOW), rng.uniform(0.06, 0.16), rng.uniform(0.01, 0.03))
        for _ in range(14)
    ]

    bm = bmesh.new()
    rows = []
    base_z = 0.3
    for r in range(RINGS + 1):
        v = r / RINGS
        row = []
        for i in range(SEGMENTS_AROUND):
            a = 2 * math.pi * i / SEGMENTS_AROUND
            z = base_z + (tops[i] - base_z) * v
            rad = _shaft_profile(a) * (1.0 - 0.06 * (z - base_z) / HEIGHT)  # エンタシス代わりの先細り
            for da, dz, size, depth in dents:
                d_ang = math.atan2(math.sin(a - da), math.cos(a - da)) * RADIUS
                dist2 = (d_ang * d_ang + (z - dz) ** 2) / (size * size)
                if dist2 < 4.0:
                    rad -= depth * math.exp(-dist2)
            row.append(bm.verts.new((rad * math.cos(a), rad * math.sin(a), z)))
        rows.append(row)
    for r in range(RINGS):
        for i in range(SEGMENTS_AROUND):
            j = (i + 1) % SEGMENTS_AROUND
            bm.faces.new((rows[r][i], rows[r][j], rows[r + 1][j], rows[r + 1][i]))
    # 折れ口の面: 中心を少し凹ませた扇
    center_z = sum(tops) / len(tops) - 0.05
    center = bm.verts.new((0.0, 0.0, center_z))
    top_row = rows[-1]
    for i in range(SEGMENTS_AROUND):
        j = (i + 1) % SEGMENTS_AROUND
        bm.faces.new((top_row[i], top_row[j], center))

    mesh = bpy.data.meshes.new("broken_column")
    bm.to_mesh(mesh)
    bm.free()
    return mesh


def _build_plinth(bpy):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= 0.95
        v.co.y *= 0.95
        v.co.z = (v.co.z + 0.5) * 0.3
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=0.025, segments=3, affect="EDGES", profile=0.5)
    mesh = bpy.data.meshes.new("broken_column_plinth")
    bm.to_mesh(mesh)
    bm.free()
    return mesh


def build(ctx):
    bpy = ctx["bpy"]
    rng = ctx["rng"]
    stone = _material(bpy, "stone", (0.42, 0.40, 0.36), 0.85)

    shaft = _build_shaft(bpy, rng)
    plinth = _build_plinth(bpy)
    # 1 オブジェクトに結合する（LOD・ライトマップを 1 枚で扱うため）
    obj = bpy.data.objects.new("broken_column", shaft)
    bpy.context.scene.collection.objects.link(obj)
    plinth_obj = bpy.data.objects.new("plinth_tmp", plinth)
    bpy.context.scene.collection.objects.link(plinth_obj)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    plinth_obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.join()

    obj.data.materials.append(stone)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    # 溝・台座の角は硬く（自動スムーズの代わりに角度でシャープ辺を付ける）
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.mesh.edges_select_sharp(sharpness=math.radians(40))
    bpy.ops.mesh.mark_sharp()
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.01)
    bpy.ops.object.mode_set(mode="OBJECT")
