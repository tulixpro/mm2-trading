#include "FLRealisticCityBlock.h"
#include "Components/SceneComponent.h"
#include "Components/StaticMeshComponent.h"
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

void AFLRealisticCityBlock::AddBox(const FVector& Location, const FVector& Scale)
{
    if (!CubeMesh) return;
    UStaticMeshComponent* Part = NewObject<UStaticMeshComponent>(this);
    Part->SetStaticMesh(CubeMesh);
    Part->SetRelativeLocation(Location);
    Part->SetRelativeScale3D(Scale);
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
    // Greybox building mass with repeated inset-like facade panels.
    AddBox(Center + FVector(0, 0, Height * 0.5f), FVector(Width * 0.005f, Depth * 0.005f, Height * 0.005f));
    AddBox(Center + FVector(0, 0, Height + 18), FVector(Width * 0.005f + 0.18f, Depth * 0.005f + 0.18f, 0.18f));

    const int32 Floors = FMath::Max(2, FMath::FloorToInt(Height / 190.0f));
    const int32 Columns = FMath::Max(2, FMath::FloorToInt(Width / 150.0f));
    for (int32 Floor = 0; Floor < Floors; ++Floor)
    {
        const float Z = 105.0f + Floor * 185.0f;
        for (int32 Col = 0; Col < Columns; ++Col)
        {
            const float X = -Width * 0.5f + 75.0f + Col * (Width / Columns);
            const float Y = -Depth * 0.5f - 5.0f;
            AddBox(Center + FVector(X, Y, Z), FVector(0.48f, 0.07f, 0.58f));
            AddBox(Center + FVector(X, Depth * 0.5f + 5.0f, Z), FVector(0.48f, 0.07f, 0.58f));
        }
    }

    // Ground-floor shopfront rhythm.
    for (int32 Shop = 0; Shop < 3; ++Shop)
    {
        const float X = -Width * 0.5f + (Shop + 0.5f) * (Width / 3.0f);
        AddBox(Center + FVector(X, -Depth * 0.5f - 7.0f, 65.0f), FVector(0.72f, 0.09f, 0.62f));
    }
}

void AFLRealisticCityBlock::BuildDistrict()
{
    // Procedural greybox only: replace primitive meshes with authored PBR assets in the art pass.
    AddBox(FVector(0, 0, -35), FVector(42, 42, 0.35f));

    // Main roads, curb strips and simple dashed lane markings.
    for (int32 I = -1; I <= 1; ++I)
    {
        const float Axis = I * 2600.0f;
        AddBox(FVector(Axis, 0, -12), FVector(4.5f, 42, 0.12f));
        AddBox(FVector(0, Axis, -12), FVector(42, 4.5f, 0.12f));
        AddBox(FVector(Axis + 570, 0, 8), FVector(1.2f, 42, 0.08f));
        AddBox(FVector(Axis - 570, 0, 8), FVector(1.2f, 42, 0.08f));
        AddBox(FVector(0, Axis + 570, 8), FVector(42, 1.2f, 0.08f));
        AddBox(FVector(0, Axis - 570, 8), FVector(42, 1.2f, 0.08f));

        for (int32 Mark = -7; Mark <= 7; ++Mark)
        {
            const float Offset = Mark * 330.0f;
            AddBox(FVector(Axis + 0, Offset, 3), FVector(0.07f, 0.85f, 0.025f));
            AddBox(FVector(Offset, Axis + 0, 3), FVector(0.85f, 0.07f, 0.025f));
        }

        for (int32 Side = -1; Side <= 1; Side += 2)
        {
            AddStreetLight(FVector(Axis + Side * 720.0f, 900.0f, 0));
            AddStreetLight(FVector(900.0f, Axis + Side * 720.0f, 0));
        }
    }

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
