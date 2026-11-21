#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "FLRealisticWeatherManager.generated.h"

class UInstancedStaticMeshComponent;
class UPostProcessComponent;
class UStaticMesh;

UCLASS()
class FRANKFURTLIFEREALISTIC_API AFLRealisticWeatherManager : public AActor
{
    GENERATED_BODY()
public:
    AFLRealisticWeatherManager();
    virtual void Tick(float DeltaSeconds) override;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Weather")
    bool bRainEnabled = true;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Weather", meta=(ClampMin="20", ClampMax="500"))
    int32 RainDropCount = 180;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Weather", meta=(ClampMin="500.0", ClampMax="10000.0"))
    float RainRadius = 3200.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Weather")
    float RainFallSpeed = 2600.0f;

protected:
    virtual void BeginPlay() override;

private:
    UPROPERTY()
    UInstancedStaticMeshComponent* RainInstances;

    UPROPERTY()
    UPostProcessComponent* WeatherPostProcess;

    UPROPERTY()
    UStaticMesh* RainMesh;

    TArray<FVector> DropPositions;
    void SetRainVisible(bool bVisible);
};
