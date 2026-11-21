"""Generate a modular fictional car dealership / service shop for Unreal Engine.
Blender 3.6+. Exports a static showroom FBX. Not a playable shop system.
"""
import bpy, os
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),"Dealership_Export"); os.makedirs(OUT,exist_ok=True)
def mat(n,c,metal=0,rough=.4):
 m=bpy.data.materials.new(n); m.diffuse_color=(*c,1); m.use_nodes=True
 p=m.node_tree.nodes.get("Principled BSDF"); p.inputs["Base Color"].default_value=(*c,1); p.inputs["Metallic"].default_value=metal; p.inputs["Roughness"].default_value=rough
 return m
CONCRETE=mat("Polished concrete",(.25,.28,.30),.15,.42); GLASS=mat("Shop glazing",(.025,.09,.12),.25,.16); WALL=mat("Showroom wall",(.78,.80,.82),.05,.55); DARK=mat("Dark steel",(.035,.045,.055),.65,.3); ORANGE=mat("Workshop safety orange",(.95,.25,.025),.25,.35); WHITE=mat("White paint",(.92,.93,.92),.1,.4); GREEN=mat("Exterior grass",(.08,.20,.09),0,.8)
def cube(n,loc,dims,m,b=.04):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.name=n; o.dimensions=dims; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(m)
 if b: q=o.modifiers.new("Soft edges","BEVEL"); q.width=b; q.segments=2; o.modifiers.new("Weighted normals","WEIGHTED_NORMAL")
 return o
bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete(use_global=False)
# 32 x 22 m single-storey showroom/service building
cube("Showroom floor",(0,0,0),(32,22,.35),CONCRETE,.08)
cube("Rear wall",(0,10,5),(32,.35,10),WALL)
cube("Left wall",(-16,0,5),(.35,20,10),WALL)
cube("Right wall",(16,0,5),(.35,20,10),WALL)
cube("Roof",(0,0,10.1),(32,22,.35),DARK,.05)
# glazed street-facing shop front with mullions
cube("Front base",(0,-10,.65),(32,.3,1.3),WALL)
cube("Front fascia",(0,-10,9.2),(32,.4,1.6),DARK)
for x in range(-14,15,4): cube("Glass mullion",(x,-10,5),(.12,.25,7.2),DARK,.015)
for x in (-12,-8,-4,0,4,8,12): cube("Display glass",(x,-10,5),(3.7,.08,7.0),GLASS,.015)
# reception counter and brand-neutral signage
cube("Reception counter",(-10,-3,1.1),(5,1.2,1.3),DARK,.12)
cube("Reception top",(-10,-3,.82),(5.3,1.35,.15),WHITE,.04)
cube("Interior sign backing",(0,9.65,8),(12,.18,1.5),DARK,.05)
cube("FRANKFURT LIFE AUTOHAUS sign",(0,9.50,8),(10,.06,.7),ORANGE,.03)
# three service bays at rear with lifts and tool cabinets
for x in (-8,0,8):
 cube("Service bay platform",(x,4,.28),(6.8,9,.18),DARK,.03)
 for y in (1,6):
  for side in (-2.5,2.5):
   cube("Hydraulic lift post",(x+side,y,1.4),(.22,.22,2.8),ORANGE,.035)
   cube("Lift arm",(x+side*.55,y,1.0),(1.1,.18,.14),DARK,.025)
 cube("Tool cabinet",(x,8,1.0),(2.5,.7,1.7),DARK,.05)
 cube("Tool cabinet top",(x,8,1.9),(2.6,.75,.12),ORANGE,.02)
# customer waiting lounge and desk
cube("Lounge sofa",(-10,3,.65),(3.2,1.0,.8),ORANGE,.14)
cube("Coffee table",(-10,5,.45),(2.0,1.0,.15),DARK,.05)
# parking forecourt, parking lines and outdoor lamps
cube("Forecourt",(0,-17,-.18),(42,12,.25),CONCRETE,.02)
for x in range(-18,19,6):
 cube("Parking bay line",(x,-17,.0),(.08,9,.025),WHITE,.005)
for x in (-18,18):
 cube("Exterior lamp post",(x,-14,3),(.12,.12,6),DARK,.025)
 cube("Exterior lamp head",(x,-14,6.1),(.65,.4,.18),WHITE,.05)
# group all as static meshes and export
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.fbx(filepath=os.path.join(OUT,"FL_Autohaus_Showroom.fbx"),use_selection=True,object_types={"MESH"},axis_forward="-Z",axis_up="Y",apply_unit_scale=True)
print("Exported modular showroom FBX.")
