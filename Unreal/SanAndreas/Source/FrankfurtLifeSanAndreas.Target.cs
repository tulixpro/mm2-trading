using UnrealBuildTool;
using System.Collections.Generic;

public class FrankfurtLifeSanAndreasTarget : TargetRules
{
    public FrankfurtLifeSanAndreasTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Game;
        DefaultBuildSettings = BuildSettingsVersion.V2;
        ExtraModuleNames.Add("FrankfurtLifeSanAndreas");
    }
}
