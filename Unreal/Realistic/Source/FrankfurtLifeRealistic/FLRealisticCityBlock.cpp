#include "FLRealisticCityBlock.h"
#include "Components/SceneComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "UObject/ConstructorHelpers.h"

AFLRealisticCityBlock::AFLRealisticCityBlock()
{
    PrimaryActorTick.bCanEverTick = false;
    SceneRoot = CreateDefaultSubobject<USceneComponent>(TEXT("SceneRoot"));
    RootComponent = SceneRoot;

    static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("/Engine/BasicShapes/Cube.Cube"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> Cylinder(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> Sphere(TEXT("/Engine/BasicShapes/Sphere.Sphere"));
    if (Cube.Succeeded()) CubeMesh = Cube.Object;
    if (Cylinder.Succeeded()) CylinderMesh = Cylinder.Object;
    if (Sphere.Succeeded()) SphereMesh = Sphere.Object;
}

void AFLRealisticCityBlock::BeginPlay()
{
    Super::BeginPlay();
    BuildDistrict();
}

void AFLRealisticCityBlock::AddBox(const FVector& Location, const FVector& Scale, const FLinearColor& Tint, const FRotator& Rotation)
{
    if (!CubeMesh) return;
    UStaticMeshComponent* Part = NewObject<UStaticMeshComponent>(this);
    Part->SetStaticMesh(CubeMesh);
    Part->SetRelativeLocation(Location);
    Part->SetRelativeRotation(Rotation);
    Part->SetRelativeScale3D(Scale);
    if (UMaterialInterface* BaseMaterial = Part->GetMaterial(0))
    {
        if (UMaterialInstanceDynamic* DynamicMaterial = UMaterialInstanceDynamic::Create(BaseMaterial, this))
        {
            DynamicMaterial->SetVectorParameterValue(TEXT("Color"), Tint);
            DynamicMaterial->SetVectorParameterValue(TEXT("BaseColor"), Tint);
            Part->SetMaterial(0, DynamicMaterial);
        }
    }
    Part->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
    Part->SetMobility(EComponentMobility::Movable);
    Part->SetupAttachment(SceneRoot);
    Part->RegisterComponent();
}

void AFLRealisticCityBlock::AddTree(const FVector& Location, float Height)
{
    if (!CylinderMesh || !SphereMesh) return;

    UStaticMeshComponent* Trunk = NewObject<UStaticMeshComponent>(this);
    Trunk->SetStaticMesh(CylinderMesh);
    Trunk->SetRelativeLocation(Location + FVector(0, 0, Height * 0.30f));
    Trunk->SetRelativeScale3D(FVector(0.16f, 0.16f, Height * 0.30f));
    Trunk->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
    Trunk->SetMobility(EComponentMobility::Movable);
    Trunk->SetupAttachment(SceneRoot);
    Trunk->RegisterComponent();

    UStaticMeshComponent* Crown = NewObject<UStaticMeshComponent>(this);
    Crown->SetStaticMesh(SphereMesh);
    Crown->SetRelativeLocation(Location + FVector(0, 0, Height * 0.78f));
    Crown->SetRelativeScale3D(FVector(0.85f, 0.85f, 1.05f));
    Crown->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    Crown->SetMobility(EComponentMobility::Movable);
    Crown->SetupAttachment(SceneRoot);
    Crown->RegisterComponent();
}

void AFLRealisticCityBlock::AddStreetLight(const FVector& Location)
{
    if (!CylinderMesh || !CubeMesh) return;

    UStaticMeshComponent* Pole = NewObject<UStaticMeshComponent>(this);
    Pole->SetStaticMesh(CylinderMesh);
    Pole->SetRelativeLocation(Location + FVector(0, 0, 230));
    Pole->SetRelativeScale3D(FVector(0.07f, 0.07f, 2.3f));
    Pole->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
    Pole->SetupAttachment(SceneRoot);
    Pole->RegisterComponent();

    AddBox(Location + FVector(55, 0, 455), FVector(0.8f, 0.07f, 0.07f));
    AddBox(Location + FVector(125, 0, 430), FVector(0.28f, 0.22f, 0.10f));
}

void AFLRealisticCityBlock::AddBuilding(const FVector& Center, float Width, float Depth, float Height, int32 Seed)
{
    // Detailed procedural placeholder facade. Replace with authored modular PBR assets for production.
    const FLinearColor FacadePalette[] = {
        FLinearColor(0.58f,0.52f,0.43f,1.0f),
        FLinearColor(0.68f,0.65f,0.58f,1.0f),
        FLinearColor(0.43f,0.48f,0.50f,1.0f),
        FLinearColor(0.55f,0.39f,0.31f,1.0f)
    };
    const FLinearColor Facade = FacadePalette[Seed % 4];
    const FLinearColor Window(0.035f,0.105f,0.15f,1.0f);
    const FLinearColor Frame(0.72f,0.70f,0.64f,1.0f);
    const FLinearColor DarkMetal(0.12f,0.14f,0.15f,1.0f);
    const FLinearColor SignColor = (Seed % 2 == 0)
        ? FLinearColor(0.12f,0.25f,0.29f,1.0f)
        : FLinearColor(0.36f,0.16f,0.10f,1.0f);

    AddBox(Center + FVector(0, 0, Height * 0.5f), FVector(Width * 0.01f, Depth * 0.01f, Height * 0.01f), Facade);

    // Roof parapet, coping and small rooftop service structures.
    AddBox(Center + FVector(0, -Depth * 0.5f, Height + 24), FVector(Width * 0.01f + 0.12f, 0.12f, 0.24f), Frame);
    AddBox(Center + FVector(0, Depth * 0.5f, Height + 24), FVector(Width * 0.01f + 0.12f, 0.12f, 0.24f), Frame);
    AddBox(Center + FVector(-Width * 0.5f, 0, Height + 24), FVector(0.12f, Depth * 0.01f, 0.24f), Frame);
    AddBox(Center + FVector(Width * 0.5f, 0, Height + 24), FVector(0.12f, Depth * 0.01f, 0.24f), Frame);
    AddBox(Center + FVector(Width * 0.22f, Depth * 0.12f, Height + 95), FVector(1.35f, 1.0f, 0.65f), DarkMetal);
    AddBox(Center + FVector(-Width * 0.20f, Depth * 0.12f, Height + 72), FVector(0.75f, 0.85f, 0.42f), FLinearColor(0.32f,0.34f,0.35f,1.0f));

    const int32 Floors = FMath::Max(2, FMath::FloorToInt(Height / 190.0f));
    const int32 Columns = FMath::Max(2, FMath::FloorToInt(Width / 150.0f));
    for (int32 Floor = 0; Floor < Floors; ++Floor)
    {
        const float Z = 105.0f + Floor * 185.0f;
        for (int32 Col = 0; Col < Columns; ++Col)
        {
            const float X = -Width * 0.5f + 75.0f + Col * (Width / Columns);
            const float FrontY = -Depth * 0.5f - 6.0f;
            const float BackY = Depth * 0.5f + 6.0f;

            // Recessed-looking glazing with pale lintels and projecting sills.
            AddBox(Center + FVector(X, FrontY, Z), FVector(0.48f, 0.07f, 0.58f), Window);
            AddBox(Center + FVector(X, FrontY - 5.0f, Z + 32.0f), FVector(0.54f, 0.045f, 0.045f), Frame);
            AddBox(Center + FVector(X, FrontY - 5.0f, Z - 32.0f), FVector(0.56f, 0.10f, 0.055f), Frame);
            AddBox(Center + FVector(X, BackY, Z), FVector(0.48f, 0.07f, 0.58f), Window);
            AddBox(Center + FVector(X, BackY + 5.0f, Z - 32.0f), FVector(0.56f, 0.10f, 0.055f), Frame);

            // A few narrow balconies add depth to selected upper-floor bays.
            if (((Col + Floor + Seed) % 4) == 0 && Floor > 0)
            {
                AddBox(Center + FVector(X, FrontY - 32.0f, Z - 62.0f), FVector(0.78f, 0.48f, 0.07f), DarkMetal);
                AddBox(Center + FVector(X, FrontY - 54.0f, Z - 25.0f), FVector(0.76f, 0.045f, 0.34f), Frame);
                AddBox(Center + FVector(X - 34.0f, FrontY - 54.0f, Z - 25.0f), FVector(0.045f, 0.42f, 0.34f), Frame);
                AddBox(Center + FVector(X + 34.0f, FrontY - 54.0f, Z - 25.0f), FVector(0.045f, 0.42f, 0.34f), Frame);
            }
        }
    }

    // Side elevation windows, fire-escape/service doors and facade pilasters.
    const int32 SideFloors = FMath::Max(2, Floors);
    for (int32 Floor = 0; Floor < SideFloors; ++Floor)
    {
        const float Z = 105.0f + Floor * 185.0f;
        for (int32 SideWindow = 0; SideWindow < 3; ++SideWindow)
        {
            const float Y = -Depth * 0.5f + 180.0f + SideWindow * ((Depth - 360.0f) / 2.0f);
            AddBox(Center + FVector(-Width * 0.5f - 5.0f, Y, Z), FVector(0.07f, 0.48f, 0.58f), Window);
            AddBox(Center + FVector(Width * 0.5f + 5.0f, Y, Z), FVector(0.07f, 0.48f, 0.58f), Window);
        }
    }
    AddBox(Center + FVector(-Width * 0.5f - 8.0f, 0, Height * 0.5f), FVector(0.10f, 0.055f, Height * 0.01f), Frame);
    AddBox(Center + FVector(Width * 0.5f + 8.0f, 0, Height * 0.5f), FVector(0.10f, 0.055f, Height * 0.01f), Frame);

    // Ground-floor retail: large shop glazing, doors, sign band and awning.
    for (int32 Shop = 0; Shop < 3; ++Shop)
    {
        const float X = -Width * 0.5f + (Shop + 0.5f) * (Width / 3.0f);
        AddBox(Center + FVector(X, -Depth * 0.5f - 8.0f, 72.0f), FVector(0.72f, 0.10f, 0.68f), Window);
        AddBox(Center + FVector(X, -Depth * 0.5f - 16.0f, 150.0f), FVector(0.92f, 0.08f, 0.13f), SignColor);
        AddBox(Center + FVector(X, -Depth * 0.5f - 30.0f, 182.0f), FVector(0.98f, 0.38f, 0.055f), DarkMetal);
        AddBox(Center + FVector(X - 42.0f, -Depth * 0.5f - 18.0f, 66.0f), FVector(0.045f, 0.07f, 0.72f), Frame);
    }
    AddBox(Center + FVector(0, -Depth * 0.5f - 13.0f, 215.0f), FVector(Width * 0.009f, 0.08f, 0.06f), Frame);
    // Ground-level service boxes and drain pipes break up otherwise flat walls.
    AddBox(Center + FVector(Width * 0.42f, -Depth * 0.5f - 18.0f, 48.0f), FVector(0.18f, 0.16f, 0.42f), DarkMetal);
    AddBox(Center + FVector(-Width * 0.43f, -Depth * 0.5f - 14.0f, Height * 0.42f), FVector(0.055f, 0.055f, Height * 0.004f), DarkMetal);
}

void AFLRealisticCityBlock::AddAbandonedSite(const FVector& Center)
{
    const FLinearColor WeatheredConcrete(0.28f,0.29f,0.27f,1.0f);
    const FLinearColor StainedConcrete(0.19f,0.20f,0.19f,1.0f);
    const FLinearColor BoardedWood(0.22f,0.14f,0.085f,1.0f);
    const FLinearColor Rust(0.25f,0.12f,0.065f,1.0f);
    const FLinearColor Weed(0.12f,0.22f,0.10f,1.0f);
    // Derelict low-rise shell with boarded openings and irregular damaged facade patches.
    AddBox(Center + FVector(0,0,250), FVector(8.5f,6.0f,2.5f), WeatheredConcrete);
    AddBox(Center + FVector(0,-610,505), FVector(8.7f,0.22f,0.18f), StainedConcrete);
    AddBox(Center + FVector(-835,0,250), FVector(0.22f,6.0f,2.5f), StainedConcrete);
    AddBox(Center + FVector(835,0,250), FVector(0.22f,6.0f,2.5f), WeatheredConcrete);
    // Boarded windows and a partly collapsed roof section.
    for (int32 I=0; I<5; ++I)
    {
        const float X=-650.0f+I*325.0f;
        AddBox(Center+FVector(X,-615,280),FVector(0.82f,0.08f,0.72f),BoardedWood);
        AddBox(Center+FVector(X,-625,280),FVector(0.86f,0.035f,0.055f),Rust,FRotator(0,0,(I%2==0)?12.0f:-9.0f));
    }
    AddBox(Center+FVector(-360,0,515),FVector(3.0f,2.8f,0.12f),StainedConcrete,FRotator(0,0,4.0f));
    AddBox(Center+FVector(520,110,535),FVector(2.0f,2.0f,0.10f),WeatheredConcrete,FRotator(0,0,-7.0f));
    // Rusted perimeter fence, gate and warning board.
    for(int32 I=0; I<9; ++I)
    {
        const float X=-1050.0f+I*260.0f;
        AddBox(Center+FVector(X,-850,105),FVector(0.055f,0.055f,1.05f),Rust);
        AddBox(Center+FVector(X,-850,185),FVector(0.055f,0.055f,0.055f),Rust);
    }
    AddBox(Center+FVector(0,-850,135),FVector(1.0f,0.06f,0.06f),Rust);
    AddBox(Center+FVector(900,-850,170),FVector(0.55f,0.12f,0.35f),BoardedWood);
    // Debris piles, weeds and scattered discarded materials.
    for(int32 I=0; I<12; ++I)
    {
        const float X=-760.0f+(I%4)*430.0f;
        const float Y=-420.0f+(I/4)*390.0f;
        AddBox(Center+FVector(X,Y,24.0f+(I%3)*12.0f),FVector(0.35f+(I%2)*0.2f,0.22f,0.10f),I%2?Rust:StainedConcrete,FRotator(0,I*17.0f,I*9.0f));
        AddBox(Center+FVector(X+95,Y+65,42),FVector(0.12f,0.12f,0.42f),Weed);
    }
    AddBox(Center+FVector(-930,-520,45),FVector(0.22f,0.18f,0.14f),FLinearColor(0.08f,0.09f,0.08f,1.0f));
}

void AFLRealisticCityBlock::BuildDistrict()
{
    // Procedural greybox only: replace primitive meshes with authored PBR assets in the art pass.
    AddBox(FVector(0, 0, -35), FVector(42, 42, 0.35f), FLinearColor(0.30f,0.31f,0.30f,1.0f));

    // Main roads, curb strips and simple dashed lane markings.
    for (int32 I = -1; I <= 1; ++I)
    {
        const float Axis = I * 2600.0f;
        AddBox(FVector(Axis, 0, -12), FVector(4.5f, 42, 0.12f), FLinearColor(0.075f,0.082f,0.09f,1.0f));
        AddBox(FVector(0, Axis, -12), FVector(42, 4.5f, 0.12f), FLinearColor(0.075f,0.082f,0.09f,1.0f));
        AddBox(FVector(Axis + 570, 0, 8), FVector(1.2f, 42, 0.08f), FLinearColor(0.58f,0.58f,0.54f,1.0f));
        AddBox(FVector(Axis - 570, 0, 8), FVector(1.2f, 42, 0.08f), FLinearColor(0.58f,0.58f,0.54f,1.0f));
        AddBox(FVector(0, Axis + 570, 8), FVector(42, 1.2f, 0.08f), FLinearColor(0.58f,0.58f,0.54f,1.0f));
        AddBox(FVector(0, Axis - 570, 8), FVector(42, 1.2f, 0.08f), FLinearColor(0.58f,0.58f,0.54f,1.0f));

        for (int32 Mark = -7; Mark <= 7; ++Mark)
        {
            const float Offset = Mark * 330.0f;
            AddBox(FVector(Axis + 0, Offset, 3), FVector(0.07f, 0.85f, 0.025f), FLinearColor(0.88f,0.86f,0.76f,1.0f));
            AddBox(FVector(Offset, Axis + 0, 3), FVector(0.85f, 0.07f, 0.025f), FLinearColor(0.88f,0.86f,0.76f,1.0f));
        }

        for (int32 Side = -1; Side <= 1; Side += 2)
        {
            AddStreetLight(FVector(Axis + Side * 720.0f, 900.0f, 0));
            AddStreetLight(FVector(900.0f, Axis + Side * 720.0f, 0));
        }
    }

    // A derelict industrial site tucked into the edge of the district.
    AddAbandonedSite(FVector(3650.0f, 3650.0f, 0.0f));

    // Nine city blocks with varied building heights, shopfronts, trees and public space.
    for (int32 X = -1; X <= 1; ++X)
    {
        for (int32 Y = -1; Y <= 1; ++Y)
        {
            const FVector Center(X * 2600.0f + 1300.0f, Y * 2600.0f + 1300.0f, 0);
            const int32 Seed = (X + 2) * 7 + (Y + 2) * 11;
            const float HeightA = 620.0f + (Seed % 4) * 190.0f;
            const float HeightB = 520.0f + ((Seed + 2) % 5) * 145.0f;

            AddBuilding(Center + FVector(-420, -380, 0), 1040.0f, 840.0f, HeightA, Seed);
            AddBuilding(Center + FVector(390, 300, 0), 800.0f, 1000.0f, HeightB, Seed + 1);

            // Low street-facing shop awning and small plaza seating block.
            AddBox(Center + FVector(-350, -820, 310), FVector(5.6f, 0.25f, 0.12f));
            AddBox(Center + FVector(540, -500, 35), FVector(1.6f, 0.28f, 0.18f));
            AddTree(Center + FVector(650, -520, 0), 520.0f);
            AddTree(Center + FVector(-650, 520, 0), 610.0f);
        }
    }
}
