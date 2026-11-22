#include "FLRealisticEnvironment.h"

#include "Components/DirectionalLightComponent.h"
#include "Components/ExponentialHeightFogComponent.h"
#include "Components/SkyAtmosphereComponent.h"
#include "Components/SkyLightComponent.h"
#include "Components/VolumetricCloudComponent.h"
#include "Components/SceneComponent.h"

AFLRealisticEnvironment::AFLRealisticEnvironment()
{
    PrimaryActorTick.bCanEverTick = false;

    SceneRoot = CreateDefaultSubobject<USceneComponent>(TEXT("EnvironmentRoot"));
    RootComponent = SceneRoot;

    SkyAtmosphere = CreateDefaultSubobject<USkyAtmosphereComponent>(TEXT("SkyAtmosphere"));
    SkyAtmosphere->SetupAttachment(SceneRoot);

    SunLight = CreateDefaultSubobject<UDirectionalLightComponent>(TEXT("SunLight"));
    SunLight->SetupAttachment(SceneRoot);
    SunLight->SetMobility(EComponentMobility::Movable);
    SunLight->SetIntensity(100000.0f);
    SunLight->SetLightColor(FLinearColor(1.0f, 0.956f, 0.88f));
    SunLight->bAtmosphereSunLight = true;
    SunLight->AtmosphereSunLightIndex = 0;
    SunLight->SetCastShadows(true);
    SunLight->SetCastVolumetricShadow(true);
    SunLight->SetRelativeRotation(FRotator(-32.0f, -35.0f, 0.0f));

    SkyLight = CreateDefaultSubobject<USkyLightComponent>(TEXT("SkyLight"));
    SkyLight->SetupAttachment(SceneRoot);
    SkyLight->SetMobility(EComponentMobility::Movable);
    SkyLight->SourceType = ESkyLightSourceType::SLS_CapturedScene;
    SkyLight->bRealTimeCapture = true;
    SkyLight->SetIntensity(1.0f);

    HeightFog = CreateDefaultSubobject<UExponentialHeightFogComponent>(TEXT("AtmosphericFog"));
    HeightFog->SetupAttachment(SceneRoot);
    HeightFog->SetFogDensity(0.008f);
    HeightFog->SetFogHeightFalloff(0.22f);
    HeightFog->SetFogInscatteringColor(FLinearColor(0.55f, 0.64f, 0.74f));
    HeightFog->SetVolumetricFog(true);
    HeightFog->SetVolumetricFogScatteringDistribution(0.2f);
    HeightFog->SetVolumetricFogAlbedo(FColor(190, 198, 208));
    HeightFog->SetVolumetricFogExtinctionScale(1.0f);
    HeightFog->SetVolumetricFogDistance(12000.0f);

    VolumetricClouds = CreateDefaultSubobject<UVolumetricCloudComponent>(TEXT("VolumetricClouds"));
    VolumetricClouds->SetupAttachment(SceneRoot);
    VolumetricClouds->SetMobility(EComponentMobility::Movable);
    VolumetricClouds->LayerBottomAltitude = 3.0f;
    VolumetricClouds->LayerHeight = 5.0f;
}

void AFLRealisticEnvironment::BeginPlay()
{
    Super::BeginPlay();
    if (SkyLight)
    {
        SkyLight->RecaptureSky();
    }
}
