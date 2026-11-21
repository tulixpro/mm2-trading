#include "FLVehicleShowcaseActor.h"
#include "Components/SceneComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "UObject/ConstructorHelpers.h"

AFLVehicleShowcaseActor::AFLVehicleShowcaseActor()
{
    PrimaryActorTick.bCanEverTick = false;
    SceneRoot = CreateDefaultSubobject<USceneComponent>(TEXT("SceneRoot"));
    RootComponent = SceneRoot;
    static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("/Engine/BasicShapes/Cube.Cube"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> Cylinder(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
    if (Cube.Succeeded()) CubeMesh = Cube.Object;
    if (Cylinder.Succeeded()) CylinderMesh = Cylinder.Object;
}
void AFLVehicleShowcaseActor::BeginPlay()
{
    Super::BeginPlay();
    if (VehicleStyle == 1) BuildVan();
    else if (VehicleStyle == 2) BuildPoliceCar();
    else BuildSedan();
}
void AFLVehicleShowcaseActor::AddPart(UStaticMesh* Mesh, const FVector& Location, const FVector& Scale, const FLinearColor& Tint, const FRotator& Rotation)
{
    if (!Mesh) return;
    UStaticMeshComponent* Part = NewObject<UStaticMeshComponent>(this);
    Part->SetStaticMesh(Mesh);
    Part->SetupAttachment(SceneRoot);
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
    Part->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    Part->SetMobility(EComponentMobility::Movable);
    Part->RegisterComponent();
}
void AFLVehicleShowcaseActor::BuildSedan()
{
    AddPart(CubeMesh, FVector(0,0,72), FVector(2.25f,0.92f,0.42f), FLinearColor(0.035f,0.12f,0.22f,1.0f));
    AddPart(CubeMesh, FVector(-12,0,132), FVector(1.12f,0.78f,0.34f), FLinearColor(0.045f,0.16f,0.22f,1.0f));
    AddPart(CubeMesh, FVector(0,0,98), FVector(1.05f,0.82f,0.025f), FLinearColor(0.28f,0.31f,0.34f,1.0f));
    AddPart(CubeMesh, FVector(105,0,78), FVector(0.16f,0.94f,0.18f), FLinearColor(0.28f,0.31f,0.34f,1.0f));
    AddPart(CubeMesh, FVector(-105,0,78), FVector(0.16f,0.94f,0.18f), FLinearColor(0.28f,0.31f,0.34f,1.0f));
    for (int32 X : {-145,145})
        for (int32 Y : {-88,88})
            AddPart(CylinderMesh, FVector(X,Y,42), FVector(0.40f,0.16f,0.40f), FLinearColor(0.018f,0.022f,0.028f,1.0f), FRotator(90,0,0));
    AddPart(CubeMesh, FVector(218,-48,80), FVector(0.08f,0.20f,0.12f), FLinearColor(0.92f,0.82f,0.58f,1.0f));
    AddPart(CubeMesh, FVector(218,48,80), FVector(0.08f,0.20f,0.12f), FLinearColor(0.92f,0.82f,0.58f,1.0f));
}
void AFLVehicleShowcaseActor::BuildVan()
{
    AddPart(CubeMesh, FVector(0,0,105), FVector(2.35f,0.98f,0.82f), FLinearColor(0.68f,0.70f,0.72f,1.0f));
    AddPart(CubeMesh, FVector(-40,0,188), FVector(1.45f,0.91f,0.18f), FLinearColor(0.045f,0.16f,0.22f,1.0f));
    AddPart(CubeMesh, FVector(0,0,25), FVector(2.15f,0.92f,0.12f), FLinearColor(0.28f,0.31f,0.34f,1.0f));
    for (int32 X : {-150,150})
        for (int32 Y : {-92,92})
            AddPart(CylinderMesh, FVector(X,Y,48), FVector(0.42f,0.17f,0.42f), FLinearColor(0.018f,0.022f,0.028f,1.0f), FRotator(90,0,0));
    AddPart(CubeMesh, FVector(230,-50,120), FVector(0.07f,0.18f,0.13f), FLinearColor(0.92f,0.82f,0.58f,1.0f));
    AddPart(CubeMesh, FVector(230,50,120), FVector(0.07f,0.18f,0.13f), FLinearColor(0.92f,0.82f,0.58f,1.0f));
}
void AFLVehicleShowcaseActor::BuildPoliceCar()
{
    BuildSedan();
    AddPart(CubeMesh, FVector(-8,0,171), FVector(0.48f,0.18f,0.07f), FLinearColor(0.72f,0.76f,0.78f,1.0f));
    AddPart(CubeMesh, FVector(-8,-25,183), FVector(0.12f,0.12f,0.08f), FLinearColor(0.025f,0.08f,0.55f,1.0f));
    AddPart(CubeMesh, FVector(-8,25,183), FVector(0.12f,0.12f,0.08f), FLinearColor(0.7f,0.015f,0.02f,1.0f));
}
