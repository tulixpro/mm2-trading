#include "FLRealisticEnvironment.h"

#include "Components/DirectionalLightComponent.h"
#include "Components/ExponentialHeightFogComponent.h"
#include "Components/SkyAtmosphereComponent.h"
#include "Components/SkyLightComponent.h"
#include "Components/VolumetricCloudComponent.h"
#include "Components/SceneComponent.h"

AFLRealisticEnvironment::AFLRealisticEnvironment()
{
    PrimaryActorTick.bCanEverTick = true;

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

void AFLRealisticEnvironment::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);

    const float SafeDuration = FMath::Max(60.0f, FullDayDurationSeconds);
    TimeOfDayHours = FMath::Fmod(TimeOfDayHours + (24.0f * DeltaSeconds / SafeDuration), 24.0f);

    // Unreal directional-light pitch: horizon at sunrise/sunset, downward at noon.
    const float SunPitch = -((TimeOfDayHours - 6.0f) * 15.0f);
    if (SunLight)
    {
        SunLight->SetWorldRotation(FRotator(SunPitch, -35.0f, 0.0f));
    }

    const float Daylight = FMath::Clamp(FMath::Sin(((TimeOfDayHours - 6.0f) / 12.0f) * PI), 0.0f, 1.0f);
    const float Twilight = FMath::Clamp(1.0f - FMath::Abs(TimeOfDayHours - 6.0f) / 2.0f, 0.0f, 1.0f)
        + FMath::Clamp(1.0f - FMath::Abs(TimeOfDayHours - 18.0f) / 2.0f, 0.0f, 1.0f);

    if (SunLight)
    {
        SunLight->SetIntensity(FMath::Lerp(0.0f, 100000.0f, FMath::Pow(Daylight, 1.35f)));
        const FLinearColor NoonColor(1.0f, 0.956f, 0.88f);
        const FLinearColor SunsetColor(1.0f, 0.48f, 0.22f);
        SunLight->SetLightColor(FLinearColor::LerpUsingHSV(SunsetColor, NoonColor, Daylight));
    }

    if (SkyLight)
    {
        SkyLight->SetIntensity(FMath::Lerp(0.08f, 1.0f, Daylight));
    }

    if (HeightFog)
    {
        HeightFog->SetFogDensity(FMath::Lerp(0.014f, 0.006f, Daylight) + Twilight * 0.0015f);
    }

    // Real-time capture is enabled above; avoid forcing an expensive recapture every frame.
    SkyRefreshAccumulator += DeltaSeconds;
    if (SkyLight && SkyRefreshAccumulator >= 8.0f)
    {
        SkyRefreshAccumulator = 0.0f;
        SkyLight->RecaptureSky();
    }
}
