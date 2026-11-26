#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "FLVehicleDamageComponent.generated.h"

class UStaticMeshComponent;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FFLVehicleDamageChanged, float, BodyHealth, float, EngineHealth, float, TyreHealth);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FFLMechanicTowRequested, const FString&, Reason);

/** Gameplay damage model. Wheel visuals are assigned in the vehicle Blueprint. */
UCLASS(ClassGroup=(FrankfurtLife), meta=(BlueprintSpawnableComponent))
class FRANKFURTLIFESANANDREAS_API : public UActorComponent
{
    GENERATED_BODY()

public:
    UFLVehicleDamageComponent();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Vehicle|Damage", meta=(ClampMin="1.0"))
    float ImpactDamageScale = 0.55f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Vehicle|Damage", meta=(ClampMin="0.0"))
    float MinimumImpactSpeedKmh = 18.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Vehicle|Damage", meta=(ClampMin="1.0"))
    float WheelDetachSpeedKmh = 95.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Vehicle|Damage", meta=(ClampMin="1.0"))
    float WheelDetachDamageThreshold = 68.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Vehicle|Damage")
    TArray<UStaticMeshComponent*> WheelVisuals;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Vehicle|Condition")
    float BodyHealth = 100.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Vehicle|Condition")
    float EngineHealth = 100.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Vehicle|Condition")
    float TyreHealth = 100.0f;

    UPROPERTY(BlueprintAssignable, Category="Vehicle|Condition")
    FFLVehicleDamageChanged OnConditionChanged;

    UPROPERTY(BlueprintAssignable, Category="Vehicle|Roadside Assistance")
    FFLMechanicTowRequested OnMechanicTowRequested;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Vehicle|Roadside Assistance")
    bool bMechanicTowRequested = false;

    UFUNCTION(BlueprintCallable, Category="Vehicle|Damage")
    void ApplyImpactDamage(float ImpactSpeedKmh, FName HitBone = NAME_None);

    UFUNCTION(BlueprintCallable, Category="Vehicle|Damage")
    void ApplyWheelImpact(int32 WheelIndex, float ImpactSpeedKmh);

    UFUNCTION(BlueprintCallable, Category="Vehicle|Damage")
    void RepairVehicle(float RepairAmount = 100.0f);

    UFUNCTION(BlueprintPure, Category="Vehicle|Condition")
    bool IsDriveable() const { return EngineHealth > 8.0f && TyreHealth > 5.0f; }

    UFUNCTION(BlueprintPure, Category="Vehicle|Roadside Assistance")
    bool IsTowRequired() const;

    UFUNCTION(BlueprintCallable, Category="Vehicle|Roadside Assistance")
    bool RequestMechanicTow();

protected:
    virtual void BeginPlay() override;

private:
    UPROPERTY()
    TArray<float> WheelDamage;

    UPROPERTY()
    TArray<bool> WheelDetached;

    UFUNCTION()
    void HandleComponentHit(UPrimitiveComponent* HitComponent, AActor* OtherActor,
        UPrimitiveComponent* OtherComp, FVector NormalImpulse, const FHitResult& Hit);

    void BroadcastCondition();
    void DetachWheelVisual(int32 WheelIndex);
};