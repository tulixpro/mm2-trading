"""Create six fictional, unbranded vehicle variants for Frankfurt Life.
Blender 3.6+. Outputs FBX files in Vehicles_Export. These are stylized detailed
game-asset bases, not photoreal scans or replicas of real manufacturers.
"""
import bpy, math, os
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),"Brand_Vehicles_Export")
os.makedirs(OUT,exist_ok=True)

def mat(n,c,metal=.3,rough=.3):
 m=bpy.data.materials.new(n); m.diffuse_color=(*c,1); m.use_nodes=True
 p=m.node_tree.nodes.get("Principled BSDF"); p.inputs["Base Color"].default_value=(*c,1); p.inputs["Metallic"].default_value=metal; p.inputs["Roughness"].default_value=rough
 return m
GLASS=mat("Smoked glass",(.012,.035,.05),.3,.16); RUBBER=mat("Tire rubber",(.012,.014,.016),0,.82); ALLOY=mat("Brushed alloy",(.55,.59,.63),.85,.2); BLACK=mat("Black trim",(.02,.025,.03),.1,.4); LAMP=mat("LED",(.85,.93,1),.1,.15); TAIL=mat("Red lamp",(.55,.01,.015),.1,.2)
def cube(n,loc,dims,m,b=.06,rot=(0,0,0)):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc,rotation=rot); o=bpy.context.object; o.name=n; o.dimensions=dims; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(m)
 if b: mod=o.modifiers.new("Edge radii","BEVEL"); mod.width=b; mod.segments=3; o.modifiers.new("Weighted normals","WEIGHTED_NORMAL")
 return o
def wheel(x,y):
 bpy.ops.mesh.primitive_torus_add(major_radius=.32,minor_radius=.095,major_segments=48,minor_segments=12,location=(x,y,.43),rotation=(math.pi/2,0,0)); bpy.context.object.name="Tire"; bpy.context.object.data.materials.append(RUBBER)
 bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.24,depth=.065,location=(x,y*1.06,.43),rotation=(math.pi/2,0,0)); bpy.context.object.name="Alloy rim"; bpy.context.object.data.materials.append(ALLOY)
def build(code,brand,paint,profile):
 bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete(use_global=False)
 body=mat(brand+" body paint",paint,.72,.23)
 length,width,roof,hood,cabin=profile
 cube("Underbody",(0,0,.57),(length,1.88,.45),BLACK,.10)
 cube("Main sculpted body",(0,0,.70),(length,1.90,.48),body,.18)
 cube("Long bonnet",(length*.30,0,.91),(hood,1.82,.18),body,.12)
 cube("Cabin volume",(-length*.10,0,1.10),(cabin,1.68,roof),body,.14)
 cube("Roof",- (0,0,0),(1,1,1),body,0) if False else None
 cube("Roof panel",(-length*.10,0,1.10+roof*.49),(cabin*.66,1.60,.10),body,.05)
 # sloped front/rear glass, side windows and pillars
 cube("Front windscreen",(cabin*.38,0,1.29),(.10,1.53,.55),GLASS,.025,(0,-.30,0))
 cube("Rear windscreen",(-cabin*.58,0,1.26),(.10,1.53,.50),GLASS,.025,(0,.30,0))
 for y in (-.86,.86):
  cube("Front side glazing",(cabin*.14,y,1.30),(cabin*.35,.035,.34),GLASS,.025)
  cube("Rear side glazing",(-cabin*.28,y,1.30),(cabin*.30,.035,.34),GLASS,.025)
  for x in (-.75,-.05,.70): cube("Window pillar",(x,y,1.30),(.045,.05,.43),BLACK,.012)
  cube("Mirror",(.72,y*1.1,1.18),(.18,.13,.11),BLACK,.025)
  cube("Headlamp",(length*.49,y*.70,.86),(.06,.34,.13),LAMP,.025)
  cube("Tail lamp",(-length*.49,y*.70,.78),(.06,.30,.15),TAIL,.025)
  cube("Door handle",(-.12,y,.91),(.20,.025,.035),ALLOY,.01)
 cube("Front grille",(length*.50,0,.70),(.045,.72,.18),BLACK,.02)
 cube("Front bumper",(length*.51,0,.43),(.14,1.88,.17),BLACK,.04)
 cube("Rear bumper",(-length*.51,0,.43),(.14,1.88,.17),BLACK,.04)
 for x in (-1.42,1.42):
  for y in (-.96,.96): wheel(x,y)
 # cabin furniture visible through glass
 cube("Dashboard",(.62,0,1.02),(.38,1.42,.16),BLACK,.04)
 cube("Center display",(.78,0,1.14),(.025,.25,.14),GLASS,.01)
 for y in (-.42,.42):
  cube("Seat cushion",(-.12,y,.91),(.46,.45,.16),BLACK,.06)
  cube("Seat back",(-.35,y,1.16),(.16,.45,.48),BLACK,.06)
 # fictional marque badge: simple abstract bar, no real-world logo
 cube("Fictional marque badge",(length*.515,0,.71),(.018,.18,.035),ALLOY,.008)
 bpy.ops.object.select_all(action="SELECT"); bpy.context.view_layer.objects.active=bpy.context.selected_objects[0]; bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY",center="BOUNDS")
 bpy.ops.object.select_all(action="SELECT")
 bpy.ops.export_scene.fbx(filepath=os.path.join(OUT,code+".fbx"),use_selection=True,object_types={"MESH"},axis_forward="-Z",axis_up="Y",apply_unit_scale=True)
 print("Exported",code,brand)
# Fictional brands with distinct segment positioning and color identity.
build("Auron_Executive_Sedan","Auron",(.035,.09,.16),(4.75,1.9,.72,1.35,2.55))
build("Veltra_Performance_Coupe","Veltra",(.48,.018,.012),(4.55,1.9,.50,1.55,2.20))
build("Nordwerk_Premium_SUV","Nordwerk",(.16,.19,.22),(4.90,1.98,.92,1.20,2.80))
build("RheinMobil_Compact","RheinMobil",(.62,.66,.69),(4.05,1.82,.62,1.05,2.20))
build("Stadtwerk_Estate","Stadtwerk",(.025,.18,.10),(4.90,1.90,.75,1.25,2.95))
build("CargoLine_Delivery_Van","CargoLine",(.78,.80,.82),(4.85,1.98,.98,1.10,2.95))
print("Six fictional marque vehicles exported.")
