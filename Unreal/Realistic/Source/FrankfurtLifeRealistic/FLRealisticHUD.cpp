#include "FLRealisticHUD.h"
#include "Engine/Canvas.h"
#include "Engine/Engine.h"
#include "Engine/World.h"
#include "FLVehicleShowcaseActor.h"

void AFLRealisticHUD::BeginPlay()
{
    Super::BeginPlay();
    ScreenStartTime = GetWorld() ? GetWorld()->GetTimeSeconds() : 0.0f;
}

void AFLRealisticHUD::DrawHUD()
{
    Super::DrawHUD();
    if (!Canvas || !GetWorld()) return;

    if (AFLVehicleShowcaseActor* Vehicle = Cast<AFLVehicleShowcaseActor>(GetOwningPawn()))
    {
        const float GaugeX = Canvas->SizeX - 245.0f;
        const float GaugeY = Canvas->SizeY - 82.0f;
        const float Fuel = Vehicle->GetFuelPercent();
        Canvas->DrawRect(FLinearColor(0.015f,0.022f,0.028f,0.82f), GaugeX - 16.0f, GaugeY - 18.0f, 220.0f, 58.0f);
        Canvas->DrawText(GEngine ? GEngine->GetSmallFont() : nullptr, FString::Printf(TEXT("FUEL  %02.0f%%"), Fuel), GaugeX, GaugeY - 10.0f);
        Canvas->DrawRect(FLinearColor(0.18f,0.20f,0.21f,1.0f), GaugeX, GaugeY + 17.0f, 180.0f, 9.0f);
        Canvas->DrawRect(Fuel < 15.0f ? FLinearColor(0.85f,0.12f,0.08f,1.0f) : FLinearColor(0.22f,0.72f,0.38f,1.0f), GaugeX, GaugeY + 17.0f, 180.0f * Fuel / 100.0f, 9.0f);
    }

    const float Elapsed = GetWorld()->GetTimeSeconds() - ScreenStartTime;
    const float IntroDuration = 4.5f;
    if (Elapsed >= IntroDuration) return;

    const float Width = Canvas->SizeX;
    const float Height = Canvas->SizeY;
    const float Progress = FMath::Clamp(Elapsed / IntroDuration, 0.0f, 1.0f);
    const float FadeIn = FMath::Clamp(Elapsed / 0.55f, 0.0f, 1.0f);
    const float FadeOut = 1.0f - FMath::Clamp((Elapsed - 3.8f) / 0.7f, 0.0f, 1.0f);
    const float Alpha = FadeIn * FadeOut;

    Canvas->DrawRect(FLinearColor(0.018f, 0.027f, 0.043f, Alpha), 0.0f, 0.0f, Width, Height);

    if (GEngine)
    {
        const float CenterX = Width * 0.5f;
        const float CenterY = Height * 0.5f;
        const float TitleScale = FMath::Clamp(Width / 1700.0f, 0.75f, 1.25f);
        Canvas->DrawText(GEngine->GetLargeFont(), TEXT("FRANKFURT LIFE"), CenterX - 250.0f * TitleScale, CenterY - 78.0f, TitleScale, TitleScale);
        Canvas->DrawText(GEngine->GetSmallFont(), TEXT("REALISTIC EDITION  |  OPEN CITY"), CenterX - 160.0f * TitleScale, CenterY - 25.0f, TitleScale, TitleScale);
        Canvas->DrawText(GEngine->GetSmallFont(), TEXT("Die Stadt wird vorbereitet ..."), CenterX - 105.0f * TitleScale, CenterY + 48.0f, TitleScale, TitleScale);

        const float BarWidth = FMath::Min(440.0f, Width * 0.55f);
        const float BarX = CenterX - BarWidth * 0.5f;
        const float BarY = CenterY + 88.0f;
        Canvas->DrawRect(FLinearColor(0.16f, 0.20f, 0.25f, Alpha), BarX, BarY, BarWidth, 5.0f);
        Canvas->DrawRect(FLinearColor(0.12f, 0.62f, 0.92f, Alpha), BarX, BarY, BarWidth * Progress, 5.0f);
    }

    Canvas->DrawRect(FLinearColor(0.035f, 0.055f, 0.075f, Alpha), 0.0f, Height - 34.0f, Width, 34.0f);
}
