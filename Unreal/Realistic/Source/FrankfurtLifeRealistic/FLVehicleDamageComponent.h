#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "FLVehicleDamageComponent.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FFLVehicleDamageChanged, float, BodyHealth, float, EngineHealth, float, TyreHealth);

/**
 * Lightweight, gameplay-oriented vehicle condition model.
 * Attach to a vehicle actor and enable hit events on its mesh components.
 * Values are normalized to 0..100; this is not a soft-body deformation solver.
 */
UCLASS(ClassGroup=(FrankfurtLife), meta=(BlueprintSpawnableComponent))
class FRANKFURTLIFEREALISTIC_API UFLVehicleDamageComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UFLVehicleDamageComponent();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Vehicle|Condition", meta=(ClampMin="1.0"))
    float ImpactDamageScale = 0.55f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Vehicle|Condition", meta=(ClampMin="0.0"))
    float MinimumImpactSpeedKmh = 18.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Vehicle|Condition")
    float BodyHealth = 100.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Vehicle|Condition")
    float EngineHealth = 100.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Vehicle|Condition")
    float TyreHealth = 100.0f;

    UPROPERTY(BlueprintAssignable, Category="Vehicle|Condition")
    FFLVehicleDamageChanged OnConditionChanged;

    UFUNCTION(BlueprintCallable, Category="Vehicle|Condition")
    void ApplyImpactDamage(float ImpactSpeedKmh, FName HitBone = NAME_None);

    UFUNCTION(BlueprintCallable, Category="Vehicle|Condition")
    void RepairVehicle(float RepairAmount = 100.0f);

    UFUNCTION(BlueprintPure, Category="Vehicle|Condition")
    bool IsDriveable() const { return EngineHealth > 8.0f && TyreHealth > 5.0f; }

protected:
    virtual void BeginPlay() override;

private:
    UFUNCTION()
    void HandleComponentHit(UPrimitiveComponent* HitComponent, AActor* OtherActor,
        UPrimitiveComponent* OtherComp, FVector NormalImpulse, const FHitResult& Hit);

    void BroadcastCondition();
};