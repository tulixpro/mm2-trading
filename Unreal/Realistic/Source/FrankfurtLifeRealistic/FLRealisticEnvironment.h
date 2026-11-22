#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "FLRealisticEnvironment.generated.h"

class USceneComponent;
class UDirectionalLightComponent;
class USkyLightComponent;
class USkyAtmosphereComponent;
class UExponentialHeightFogComponent;
class UVolumetricCloudComponent;

/**
 * Runtime foundation for Frankfurt Life's outdoor rendering.
 * Uses Unreal's physically based atmosphere, movable sun, skylight and volumetric fog.
 * Art-directed weather and authored materials are layered on top of this actor.
 */
UCLASS()
class FRANKFURTLIFEREALISTIC_API AFLRealisticEnvironment : public AActor
{
    GENERATED_BODY()

public:
    AFLRealisticEnvironment();

protected:
    virtual void BeginPlay() override;

private:
    UPROPERTY(VisibleAnywhere, Category="Environment")
    TObjectPtr<USceneComponent> SceneRoot;

    UPROPERTY(VisibleAnywhere, Category="Environment|Lighting")
    TObjectPtr<UDirectionalLightComponent> SunLight;

    UPROPERTY(VisibleAnywhere, Category="Environment|Lighting")
    TObjectPtr<USkyLightComponent> SkyLight;

    UPROPERTY(VisibleAnywhere, Category="Environment|Atmosphere")
    TObjectPtr<USkyAtmosphereComponent> SkyAtmosphere;

    UPROPERTY(VisibleAnywhere, Category="Environment|Atmosphere")
    TObjectPtr<UExponentialHeightFogComponent> HeightFog;

    UPROPERTY(VisibleAnywhere, Category="Environment|Atmosphere")
    TObjectPtr<UVolumetricCloudComponent> VolumetricClouds;
};
