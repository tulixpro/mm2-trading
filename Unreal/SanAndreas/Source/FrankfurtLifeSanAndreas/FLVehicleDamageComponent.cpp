#include "FLVehicleDamageComponent.h"
#include "Components/PrimitiveComponent.h"
#include "Components/StaticMeshComponent.h"
#include "GameFramework/Actor.h"

UFLVehicleDamageComponent::UFLVehicleDamageComponent()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UFLVehicleDamageComponent::BeginPlay()
{
    Super::BeginPlay();

    WheelDamage.SetNum(WheelVisuals.Num());
    WheelDetached.Init(false, WheelVisuals.Num());

    TArray<UPrimitiveComponent*> Primitives;
    GetOwner()->GetComponents<UPrimitiveComponent>(Primitives);
    for (UPrimitiveComponent* Primitive : Primitives)
    {
        if (Primitive)
        {
            Primitive->OnComponentHit.AddDynamic(this, &UFLVehicleDamageComponent::HandleComponentHit);
        }
    }
}

void UFLVehicleDamageComponent::HandleComponentHit(UPrimitiveComponent* HitComponent,
    AActor* OtherActor, UPrimitiveComponent* OtherComp, FVector NormalImpulse, const FHitResult& Hit)
{
    if (!OtherActor || OtherActor == GetOwner())
    {
        return;
    }

    const FVector OwnVelocity = HitComponent ? HitComponent->GetComponentVelocity() : FVector::ZeroVector;
    const FVector OtherVelocity = OtherComp ? OtherComp->GetComponentVelocity() : FVector::ZeroVector;
    const float ImpactSpeedKmh = (OwnVelocity - OtherVelocity).Size() * 0.036f;
    ApplyImpactDamage(ImpactSpeedKmh, Hit.BoneName);

    // Blueprint vehicle setup may call ApplyWheelImpact with the wheel index
    // from its wheel collision component / Chaos vehicle wheel mapping.
}

void UFLVehicleDamageComponent::ApplyImpactDamage(float ImpactSpeedKmh, FName HitBone)
{
    if (ImpactSpeedKmh < MinimumImpactSpeedKmh)
    {
        return;
    }

    const float Damage = FMath::Clamp((ImpactSpeedKmh - MinimumImpactSpeedKmh) * ImpactDamageScale, 0.0f, 45.0f);
    if (Damage <= KINDA_SMALL_NUMBER)
    {
        return;
    }

    BodyHealth = FMath::Max(0.0f, BodyHealth - Damage);

    const FString BoneLabel = HitBone.ToString().ToLower();
    if (BoneLabel.Contains(TEXT("wheel")) || BoneLabel.Contains(TEXT("tire")) || BoneLabel.Contains(TEXT("tyre")))
    {
        TyreHealth = FMath::Max(0.0f, TyreHealth - Damage * 0.85f);
    }
    else
    {
        EngineHealth = FMath::Max(0.0f, EngineHealth - Damage * 0.22f);
    }

    BroadcastCondition();
}

void UFLVehicleDamageComponent::ApplyWheelImpact(int32 WheelIndex, float ImpactSpeedKmh)
{
    if (!WheelVisuals.IsValidIndex(WheelIndex) || WheelDetached[WheelIndex] ||
        ImpactSpeedKmh < MinimumImpactSpeedKmh)
    {
        return;
    }

    const float Damage = FMath::Clamp((ImpactSpeedKmh - MinimumImpactSpeedKmh) * ImpactDamageScale, 0.0f, 60.0f);
    WheelDamage[WheelIndex] = FMath::Clamp(WheelDamage[WheelIndex] + Damage, 0.0f, 100.0f);
    TyreHealth = FMath::Max(0.0f, TyreHealth - Damage * 0.35f);
    BodyHealth = FMath::Max(0.0f, BodyHealth - Damage * 0.18f);

    if (UStaticMeshComponent* Wheel = WheelVisuals[WheelIndex])
    {
        // Progressive visual misalignment before the wheel reaches the break-off threshold.
        const float BendAngle = FMath::Min(WheelDamage[WheelIndex] * 0.22f, 18.0f);
        Wheel->SetRelativeRotation(Wheel->GetRelativeRotation() + FRotator(0.0f, BendAngle, 0.0f));
    }

    if (ImpactSpeedKmh >= WheelDetachSpeedKmh &&
        WheelDamage[WheelIndex] >= WheelDetachDamageThreshold)
    {
        DetachWheelVisual(WheelIndex);
    }

    BroadcastCondition();
}

void UFLVehicleDamageComponent::DetachWheelVisual(int32 WheelIndex)
{
    if (!WheelVisuals.IsValidIndex(WheelIndex) || !WheelVisuals[WheelIndex])
    {
        return;
    }

    UStaticMeshComponent* Wheel = WheelVisuals[WheelIndex];
    WheelDetached[WheelIndex] = true;
    Wheel->DetachFromComponent(FDetachmentTransformRules::KeepWorldTransform);
    Wheel->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
    Wheel->SetSimulatePhysics(true);
    Wheel->AddImpulse(FVector(0.0f, 0.0f, 1.0f) * 18000.0f);
}

void UFLVehicleDamageComponent::RepairVehicle(float RepairAmount)
{
    const float Amount = FMath::Clamp(RepairAmount, 0.0f, 100.0f);
    BodyHealth = FMath::Min(100.0f, BodyHealth + Amount);
    EngineHealth = FMath::Min(100.0f, EngineHealth + Amount);
    TyreHealth = FMath::Min(100.0f, TyreHealth + Amount);
    for (int32 Index = 0; Index < WheelDamage.Num(); ++Index)
    {
        WheelDamage[Index] = FMath::Max(0.0f, WheelDamage[Index] - Amount);
    }
    BroadcastCondition();
}

bool UFLVehicleDamageComponent::IsTowRequired() const
{
    if (!IsDriveable())
    {
        return true;
    }

    for (const bool bDetached : WheelDetached)
    {
        if (bDetached)
        {
            return true;
        }
    }
    return false;
}

bool UFLVehicleDamageComponent::RequestMechanicTow()
{
    if (!IsTowRequired() || bMechanicTowRequested)
    {
        return false;
    }

    bMechanicTowRequested = true;
    const FString Reason = EngineHealth <= 8.0f
        ? TEXT("Motorschaden")
        : (TyreHealth <= 5.0f ? TEXT("Reifenschaden") : TEXT("Rad abgerissen"));
    OnMechanicTowRequested.Broadcast(Reason);
    return true;
}

void UFLVehicleDamageComponent::BroadcastCondition()
{
    OnConditionChanged.Broadcast(BodyHealth, EngineHealth, TyreHealth);
}