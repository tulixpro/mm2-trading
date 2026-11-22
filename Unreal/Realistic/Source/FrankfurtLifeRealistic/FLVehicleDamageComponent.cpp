#include "FLVehicleDamageComponent.h"
#include "Components/PrimitiveComponent.h"
#include "GameFramework/Actor.h"

UFLVehicleDamageComponent::UFLVehicleDamageComponent()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UFLVehicleDamageComponent::BeginPlay()
{
    Super::BeginPlay();

    // Bind to the vehicle's primitive meshes. Hit notifications must be enabled
    // on the relevant collision components in the vehicle Blueprint.
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

    const FVector OwnVelocity = HitComponent ? HitComponent->GetPhysicsLinearVelocity() : FVector::ZeroVector;
    const FVector OtherVelocity = OtherComp ? OtherComp->GetPhysicsLinearVelocity() : FVector::ZeroVector;
    const float ImpactSpeedKmh = (OwnVelocity - OtherVelocity).Size() * 0.036f;
    ApplyImpactDamage(ImpactSpeedKmh, Hit.BoneName);
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

    // A hit to a wheel-named component/bone affects tyre condition;
    // otherwise a portion of the impact is transferred to engine condition.
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

void UFLVehicleDamageComponent::RepairVehicle(float RepairAmount)
{
    const float Amount = FMath::Clamp(RepairAmount, 0.0f, 100.0f);
    BodyHealth = FMath::Min(100.0f, BodyHealth + Amount);
    EngineHealth = FMath::Min(100.0f, EngineHealth + Amount);
    TyreHealth = FMath::Min(100.0f, TyreHealth + Amount);
    BroadcastCondition();
}

void UFLVehicleDamageComponent::BroadcastCondition()
{
    OnConditionChanged.Broadcast(BodyHealth, EngineHealth, TyreHealth);
}