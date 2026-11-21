#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "FLVehicleShowcaseActor.generated.h"
class USceneComponent;
class UStaticMesh;
UCLASS()
class FRANKFURTLIFEREALISTIC_API AFLVehicleShowcaseActor : public AActor
{
    GENERATED_BODY()
public:
    AFLVehicleShowcaseActor();
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Vehicle")
    int32 VehicleStyle = 0;
protected:
    virtual void BeginPlay() override;
private:
    UPROPERTY() USceneComponent* SceneRoot;
    UPROPERTY() UStaticMesh* CubeMesh;
    UPROPERTY() UStaticMesh* CylinderMesh;
    void AddPart(UStaticMesh* Mesh, const FVector& Location, const FVector& Scale, const FLinearColor& Tint, const FRotator& Rotation = FRotator::ZeroRotator);
    void BuildSedan();
    void BuildVan();
    void BuildPoliceCar();
};
