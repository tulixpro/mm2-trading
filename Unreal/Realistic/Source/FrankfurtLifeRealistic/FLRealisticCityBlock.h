#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "FLRealisticCityBlock.generated.h"

class UStaticMesh;
class USceneComponent;

UCLASS()
class FRANKFURTLIFEREALISTIC_API AFLRealisticCityBlock : public AActor
{
    GENERATED_BODY()

public:
    AFLRealisticCityBlock();

protected:
    virtual void BeginPlay() override;

private:
    UPROPERTY()
    USceneComponent* SceneRoot;

    UPROPERTY()
    UStaticMesh* CubeMesh;

    UPROPERTY()
    UStaticMesh* CylinderMesh;

    UPROPERTY()
    UStaticMesh* SphereMesh;

    void AddBox(const FVector& Location, const FVector& Scale);
    void AddTree(const FVector& Location, float Height);
    void AddStreetLight(const FVector& Location);
    void AddBuilding(const FVector& Center, float Width, float Depth, float Height, int32 Seed);
    void BuildDistrict();
};