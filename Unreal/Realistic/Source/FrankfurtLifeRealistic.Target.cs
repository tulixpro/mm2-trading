using UnrealBuildTool;
using System.Collections.Generic;

public class FrankfurtLifeRealisticTarget : TargetRules
{
    public FrankfurtLifeRealisticTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Game;
        DefaultBuildSettings = BuildSettingsVersion.V4;
        IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_4;
        ExtraModuleNames.Add("FrankfurtLifeRealistic");
    }
}
