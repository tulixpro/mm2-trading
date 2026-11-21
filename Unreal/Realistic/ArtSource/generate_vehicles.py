"""Generate generic, detailed Frankfurt Life vehicle meshes for Unreal Engine.
Run with Blender 3.6+ in background or from the Blender Text Editor.
Exports FBX files to Vehicles_Export beside this script.
No manufacturer logos or trademarked designs are used.
"""
import bpy, math, os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Vehicles_Export")
os.makedirs(OUT, exist_ok=True)

def mat(name, color, metallic=0.0, rough=.4, coat=0.0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value=(*color,1); p.inputs["Metallic"].default_value=metallic
    p.inputs["Roughness"].default_value=rough
    if "Coat Weight" in p.inputs: p.inputs["Coat Weight"].default_value=coat
    return m
PAINT=mat("Automotive Paint - Graphite Blue",(.025,.075,.12),.78,.22,.45)
WHITE=mat("Police White Paint",(.78,.82,.84),.62,.24,.35)
GLASS=mat("Tinted Automotive Glass",(.012,.035,.045),.32,.12,.5)
RUBBER=mat("Tire Rubber",(.012,.014,.017),0,.78)
RIM=mat("Machined Alloy",(.48,.53,.58),.86,.2,.2)
DARK=mat("Dark Trim",(.018,.022,.026),.2,.36)
CHROME=mat("Chrome",(.7,.75,.78),.92,.16)
LAMP=mat("LED Headlamp",(.82,.9,1),.18,.16)
RED=mat("Rear Lamp",(.55,.012,.018),.2,.2)
BLUE=mat("Police Blue",(.015,.06,.65),.45,.24)
BLACK=mat("Interior Leather",(.035,.04,.045),.08,.5)
SCREEN=mat("Dashboard Display",(.008,.025,.035),.15,.2)

def finish(o,m,b=0):
    o.data.materials.append(m)
    if o.type=="MESH":
        for f in o.data.polygons: f.use_smooth=True
        if b:
            mod=o.modifiers.new("Soft manufactured edges","BEVEL"); mod.width=b; mod.segments=3
            o.modifiers.new("Weighted corner normals","WEIGHTED_NORMAL")
    return o
def cube(n,loc,scale,m,b=.08,rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc,rotation=rot)
    o=bpy.context.object; o.name=n; o.dimensions=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,m,b)
def cyl(n,loc,r,d,m,rot=(math.pi/2,0,0),v=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=v,radius=r,depth=d,location=loc,rotation=rot)
    o=bpy.context.object; o.name=n; return finish(o,m,.018)
def torus(n,loc,major,minor,m):
    bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=48,minor_segments=12,location=loc,rotation=(math.pi/2,0,0))
    o=bpy.context.object; o.name=n; return finish(o,m)
def sphere(n,loc,scale,m):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=loc)
    o=bpy.context.object; o.name=n; o.scale=scale; return finish(o,m)
def clear():
    bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete(use_global=False)

def build(name,paint,van=False,police=False):
    clear()
    # +X is front; Y is width; Z is up. Approx. 4.7 x 1.9 m.
    if van:
        cube("Lower body shell",(0,0,.70),(4.65,1.88,.78),paint,.22)
        cube("Tall cabin shell",(-.12,0,1.28),(2.85,1.78,1.0),paint,.16)
        cube("Front bonnet",(1.53,0,.98),(1.15,1.82,.24),paint,.12)
    else:
        cube("Lower body shell",(0,0,.63),(4.72,1.88,.55),paint,.22)
        cube("Front bonnet",(1.48,0,.91),(1.35,1.82,.22),paint,.14)
        cube("Passenger cabin",(-.22,0,1.13),(2.55,1.68,.78),paint,.18)
        cube("Roof panel",(-.25,0,1.55),(1.65,1.62,.12),paint,.09)
        cube("Front windscreen",(.76,0,1.34),(.10,1.55,.62),GLASS,.035,(0,-math.radians(23),0))
        cube("Rear windscreen",(-1.12,0,1.32),(.10,1.52,.58),GLASS,.035,(0,math.radians(25),0))
    cube("Front bumper",(2.36,0,.48),(.18,1.88,.24),DARK,.07)
    cube("Rear bumper",(-2.36,0,.48),(.18,1.88,.24),DARK,.07)
    cube("Front grille surround",(2.39,0,.73),(.045,.82,.23),CHROME,.035)
    cube("Grille insert",(2.42,0,.73),(.035,.72,.15),DARK,.025)
    for y in (-.55,-.36,-.18,0,.18,.36,.55):
        cube("Grille slat",(2.445,y,.73),(.018,.018,.14),CHROME,.006)
    for y in (-.68,.68):
        cube("LED headlight",(2.34,y,.88),(.09,.38,.15),LAMP,.055)
        cube("Rear tail lamp",(-2.34,y,.79),(.08,.34,.17),RED,.045)
        cube("Side mirror",(.63,y*1.42,1.20),(.24,.16,.13),DARK,.055)
        cube("Door handle",(-.18,y*1.01,.91),(.24,.035,.045),CHROME,.018)
        cube("Lower door trim",(-.05,y*1.005,.52),(1.35,.025,.045),DARK,.018)
    if not van:
        for y in (-.855,.855):
            cube("Front side window",(.42,y,1.30),(.68,.035,.43),GLASS,.045,(0,-.08,0))
            cube("Rear side window",(-.48,y,1.30),(.68,.035,.43),GLASS,.045,(0,.06,0))
            cube("Rear quarter window",(-1.02,y,1.28),(.26,.035,.39),GLASS,.035)
            for x in (-.84,-.12,.78): cube("Window pillar",(x,y,1.31),(.045,.05,.49),DARK,.012)
    else:
        for y in (-.91,.91):
            cube("Van front side window",(.62,y,1.42),(.68,.035,.48),GLASS,.04)
            cube("Van cargo window",(-.42,y,1.45),(.85,.035,.42),GLASS,.04)
    # Four complete wheels with sidewalls, barrels, alloy faces, hubs and spokes.
    for x in (-1.48,1.48):
        for y in (-.96,.96):
            z=.48
            torus("Rubber tire",(x,y,z),.365,.105,RUBBER)
            cyl("Wheel barrel",(x,y,z),.285,.20,DARK)
            cyl("Alloy face",(x,y*1.07,z),.255,.045,RIM)
            cyl("Center hub",(x,y*1.10,z),.075,.05,CHROME)
            for a in range(5):
                ang=2*math.pi*a/5
                sp=cube("Alloy spoke",(x+.145*math.cos(ang),y*1.105,z+.145*math.sin(ang)),(.22,.035,.045),CHROME,.018)
                sp.rotation_euler[1]=-ang
    # Cabin details visible through the glazing.
    cube("Dashboard",(.72,0,1.02),(.42,1.45,.18),BLACK,.06)
    cube("Center display",(.88,0,1.16),(.035,.28,.17),SCREEN,.025)
    for y in (-.43,.43):
        cube("Front seat cushion",(-.15,y,.92),(.48,.48,.18),BLACK,.08)
        cube("Front seat back",(-.38,y,1.20),(.18,.48,.52),BLACK,.07)
        cube("Headrest",(-.43,y,1.50),(.16,.28,.17),BLACK,.06)
    cube("Steering wheel",(.65,-.43,1.22),(.055,.32,.32),DARK,.12,(0,math.pi/2,0))
    cube("Rear bench seat",(-1.05,0,.96),(.45,1.30,.22),BLACK,.08)
    for x in (-1.48,1.48):
        for y in (-.96,.96): torus("Wheel arch trim",(x,y*.90,.48),.43,.025,DARK)
    for y in (-.48,.48): cyl("Exhaust tip",(-2.42,y,.39),.055,.10,CHROME,rot=(0,math.pi/2,0),v=24)
    if police:
        for y in (-.955,.955): cube("Police door stripe",(0,y,.78),(1.0,.035,.32),BLUE,.025)
        cube("Lightbar base",(-.15,0,1.68),(.68,.22,.07),DARK,.025)
        for y in (-.15,.15): sphere("Emergency beacon",(-.15,y,1.78),(.16,.12,.11),BLUE)
        cube("Roof antenna",(-.9,0,1.68),(.035,.035,.28),DARK,.015)
    bpy.ops.object.select_all(action="SELECT")
    bpy.context.view_layer.objects.active=bpy.context.selected_objects[0]
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY",center="BOUNDS")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.fbx(filepath=os.path.join(OUT,name+".fbx"),use_selection=True,object_types={"MESH"},axis_forward="-Z",axis_up="Y",apply_unit_scale=True)
    print("Exported",name)

build("FL_Modern_Sedan",PAINT)
build("FL_City_Van",WHITE,van=True)
build("FL_Police_Sedan",WHITE,police=True)
print("Done. Import FBX files into Unreal Content/Vehicles.")
