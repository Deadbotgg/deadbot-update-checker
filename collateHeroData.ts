import fs from 'fs';
import path from 'path';
import {
  convertAbility,
  type ConvertedAbility,
} from './generic_ability_parser';

interface WeaponStats {
  bullet_damage: number;
  rounds_per_second: number;
  clip_size: number;
  reload_time: number;
  reload_movespeed: number;
  reload_delay: number;
  reload_single: boolean;
  bullet_speed: number;
  falloff_start_range: number;
  falloff_end_range: number;
  falloff_start_scale: number;
  falloff_end_scale: number;
  falloff_bias: number;
  bullet_gravity_scale: number;
  bullets_per_shot: number;
  bullets_per_burst: number;
  burst_inter_shot_interval: number;
  dps: number;
  sustained_dps: number;
  weapon_name: string;
  weapon_description: string;
  weapon_types?: string[];
}

interface SpiritScaling {
  [key: string]: number;
}

interface CollisionData {
  radius: number;
  height: number;
  step_height: number;
}

interface MovementData {
  stealth_speed: number;
  footstep_sound_distance: number;
  step_sound_time: number;
}

interface VisualsData {
  ui_color: number[];
  glow_colors: {
    friendly: number[];
    enemy: number[];
    team1: number[];
    team2: number[];
  };
  model_skin: number;
}

interface ItemSlotData {
  max_purchases_per_tier: number[];
}

interface PurchaseBonus {
  tier: number;
  value: number;
  type: string;
}

interface StatsDisplayData {
  health_header_stats: string[];
  health_stats: string[];
  weapon_header_stats: string[];
  weapon_stats: string[];
  magic_header_stats: string[];
  magic_stats: string[];
}

interface HeroData {
  id: number;
  new_player_friendly: boolean;
  name: string;
  lore?: string;
  playstyle?: string;
  role?: string;
  in_development: boolean;
  is_disabled: boolean;
  complexity: number;
  readability: number;
  bot_selectable: boolean;
  lane_testing_recommended: boolean;
  starting_stats: {
    max_move_speed: number;
    sprint_speed: number;
    crouch_speed: number;
    move_acceleration: number;
    light_melee_damage: number;
    heavy_melee_damage: number;
    max_health: number;
    weapon_power: number;
    reload_speed: number;
    weapon_power_scale: number;
    stamina: number;
    base_health_regen: number;
    stamina_regen_per_second: number;
    stamina_cooldown?: number;
    crit_damage_received_scale?: number;
    tech_range?: number;
    tech_duration?: number;
  };
  abilities: string[] | ConvertedAbility[];
  level_upgrades: { [key: string]: string | null };
  spirit_scaling?: SpiritScaling;
  weapon_stats?: WeaponStats;
  recommended_items?: string[];
  collision: CollisionData;
  movement: MovementData;
  visuals: VisualsData;
  item_slots: {
    weapon_mod: ItemSlotData;
    armor: ItemSlotData;
    tech: ItemSlotData;
  };
  purchase_bonuses: {
    weapon_mod: PurchaseBonus[];
    armor: PurchaseBonus[];
    tech: PurchaseBonus[];
  };
  stats_display: StatsDisplayData;
}

const ENGINE_UNITS_PER_METER = 100;

export function collateHeroData(outputBaseDir: string): void {
  console.log('Collating hero data...');

  const heroesFile = path.join(outputBaseDir, 'scripts', 'heroes.json');
  const abilitiesFile = path.join(outputBaseDir, 'scripts', 'abilities.json');
  const localisationFile = path.join(
    outputBaseDir,
    'localisation',
    'citadel_heroes_english.json'
  );
  const gcLocalisationFile = path.join(
    outputBaseDir,
    'localisation',
    'citadel_gc_english.json'
  );

  if (
    !fs.existsSync(heroesFile) ||
    !fs.existsSync(abilitiesFile) ||
    !fs.existsSync(localisationFile)
  ) {
    console.error(
      'Required files are missing. Make sure all necessary files have been parsed.'
    );
    console.log('Heroes file exists:', fs.existsSync(heroesFile));
    console.log('Abilities file exists:', fs.existsSync(abilitiesFile));
    console.log('Localisation file exists:', fs.existsSync(localisationFile));
    return;
  }

  let heroesData, abilitiesData, localisationData, gcLocalisationData;

  try {
    heroesData = JSON.parse(fs.readFileSync(heroesFile, 'utf-8'));
    console.log('Heroes data parsed successfully');
  } catch (error) {
    console.error('Error parsing heroes data:', error);
    return;
  }

  try {
    abilitiesData = JSON.parse(fs.readFileSync(abilitiesFile, 'utf-8'));
    console.log('Abilities data parsed successfully');
  } catch (error) {
    console.error('Error parsing abilities data:', error);
    return;
  }

  try {
    localisationData = JSON.parse(fs.readFileSync(localisationFile, 'utf-8'));
    console.log('Localisation data parsed successfully');
  } catch (error) {
    console.error('Error parsing localisation data:', error);
    return;
  }

  try {
    gcLocalisationData = JSON.parse(
      fs.readFileSync(gcLocalisationFile, 'utf-8')
    );
    console.log('GC Localisation data parsed successfully');
  } catch (error) {
    console.error('Error parsing GC localisation data:', error);
    return;
  }

  if (!heroesData || typeof heroesData !== 'object' || !heroesData) {
    console.error('Invalid heroes data structure');
    return;
  }

  const consolidatedData: { [key: string]: HeroData } = {};

  // Process heroes
  for (const [heroName, heroData] of Object.entries(heroesData)) {
    if (!heroName.startsWith('hero_') && !heroName.endsWith("base") && !heroName.endsWith("dummy")) continue;

    const cleanHeroName = heroName.replace('hero_', '');

    try {
      const hero: HeroData = {
        id: (heroData as any)['m_HeroID'],
        name: gcLocalisationData['Steam_RP_' + heroName] || heroName,
        new_player_friendly: (heroData as any)['m_bNewPlayerRecommended'] || false,
        in_development: (heroData as any)['m_bInDevelopment'] || false,
        is_disabled: (heroData as any)['m_bDisabled'] || false,
        complexity: (heroData as any)['m_nComplexity'] || 1,
        readability: (heroData as any)['m_nReadability'] || 1,
        bot_selectable: (heroData as any)['m_bBotSelectable'] || false,
        lane_testing_recommended: (heroData as any)['m_bLaneTestingRecommended'] || false,
        starting_stats: {
          max_move_speed: (heroData as any)['m_mapStartingStats']['EMaxMoveSpeed'],
          sprint_speed: (heroData as any)['m_mapStartingStats']['ESprintSpeed'],
          crouch_speed: (heroData as any)['m_mapStartingStats']['ECrouchSpeed'],
          move_acceleration: (heroData as any)['m_mapStartingStats']['EMoveAcceleration'],
          light_melee_damage: (heroData as any)['m_mapStartingStats']['ELightMeleeDamage'],
          heavy_melee_damage: (heroData as any)['m_mapStartingStats']['EHeavyMeleeDamage'],
          max_health: (heroData as any)['m_mapStartingStats']['EMaxHealth'],
          weapon_power: (heroData as any)['m_mapStartingStats']['EWeaponPower'],
          reload_speed: (heroData as any)['m_mapStartingStats']['EReloadSpeed'],
          weapon_power_scale: (heroData as any)['m_mapStartingStats']['EWeaponPowerScale'],
          stamina: (heroData as any)['m_mapStartingStats']['EStamina'],
          base_health_regen: (heroData as any)['m_mapStartingStats']['EBaseHealthRegen'],
          stamina_regen_per_second: (heroData as any)['m_mapStartingStats']['EStaminaRegenPerSecond'],
          stamina_cooldown: 1 / (heroData as any)['m_mapStartingStats']['EStaminaRegenPerSecond'],
          crit_damage_received_scale: ((heroData as any)['m_mapStartingStats']['ECritDamageReceivedScale'] - 1) * 100,
          tech_range: (heroData as any)['m_mapStartingStats']['ETechRange'] - 1,
          tech_duration: (heroData as any)['m_mapStartingStats']['ETechDuration'] - 1
        },
        abilities: [],
        level_upgrades: {},
        collision: {
          radius: (heroData as any)['m_flCollisionRadius'],
          height: (heroData as any)['m_flCollisionHeight'],
          step_height: (heroData as any)['m_flStepHeight']
        },
        movement: {
          stealth_speed: (heroData as any)['m_flStealthSpeedMetersPerSecond'],
          footstep_sound_distance: (heroData as any)['m_flFootstepSoundTravelDistanceMeters'],
          step_sound_time: (heroData as any)['m_flStepSoundTime']
        },
        visuals: {
          ui_color: (heroData as any)['m_colorUI'],
          glow_colors: {
            friendly: (heroData as any)['m_colorGlowFriendly'],
            enemy: (heroData as any)['m_colorGlowEnemy'],
            team1: (heroData as any)['m_colorGlowTeam1'],
            team2: (heroData as any)['m_colorGlowTeam2']
          },
          model_skin: (heroData as any)['m_nModelSkin'] || 0
        },
        item_slots: {
          weapon_mod: {
            max_purchases_per_tier: (heroData as any)['m_mapItemSlotInfo']['EItemSlotType_WeaponMod']['m_arMaxPurchasesForTier']
          },
          armor: {
            max_purchases_per_tier: (heroData as any)['m_mapItemSlotInfo']['EItemSlotType_Armor']['m_arMaxPurchasesForTier']
          },
          tech: {
            max_purchases_per_tier: (heroData as any)['m_mapItemSlotInfo']['EItemSlotType_Tech']['m_arMaxPurchasesForTier']
          }
        },
        purchase_bonuses: {
          weapon_mod: ((heroData as any)['m_mapPurchaseBonuses']['EItemSlotType_WeaponMod'] || []).map((bonus: any) => ({
            tier: bonus.m_nTier,
            value: bonus.m_strValue,
            type: bonus.m_ValueType
          })),
          armor: ((heroData as any)['m_mapPurchaseBonuses']['EItemSlotType_Armor'] || []).map((bonus: any) => ({
            tier: bonus.m_nTier,
            value: bonus.m_strValue,
            type: bonus.m_ValueType
          })),
          tech: ((heroData as any)['m_mapPurchaseBonuses']['EItemSlotType_Tech'] || []).map((bonus: any) => ({
            tier: bonus.m_nTier,
            value: bonus.m_strValue,
            type: bonus.m_ValueType
          }))
        },
        stats_display: {
          health_header_stats: (heroData as any)['m_heroStatsDisplay']['m_vecHealthHeaderStats'] || [],
          health_stats: (heroData as any)['m_heroStatsDisplay']['m_vecHealthStats'] || [],
          weapon_header_stats: (heroData as any)['m_heroStatsDisplay']['m_vecWeaponHeaderStats'] || [],
          weapon_stats: (heroData as any)['m_heroStatsDisplay']['m_vecWeaponStats'] || [],
          magic_header_stats: (heroData as any)['m_heroStatsDisplay']['m_vecMagicHeaderStats'] || [],
          magic_stats: (heroData as any)['m_heroStatsDisplay']['m_vecMagicStats'] || []
        }
      };

      // Abilities
      const abilities = (heroData as any)['m_mapBoundAbilities'];
      hero.abilities = [
        abilities['ESlot_Signature_1'],
        abilities['ESlot_Signature_2'],
        abilities['ESlot_Signature_3'],
        abilities['ESlot_Signature_4'],
      ];

      hero.abilities = (hero.abilities as string[]).map((ability: string) => ({
        name: localisationData[ability] || ability,
        ...convertAbility(abilitiesData, ability, localisationData),
      })) as ConvertedAbility[];

      // Level upgrades
      const standardLevelUpgrades = (heroData as any)['m_mapStandardLevelUpUpgrades'];
      if (standardLevelUpgrades) {
        for (const [key, value] of Object.entries(standardLevelUpgrades)) {
          hero.level_upgrades[key.toLowerCase()] = value as string;
        }
      }

      // Spirit Scaling
      const spiritScalings = (heroData as any)['m_mapScalingStats'];
      if (spiritScalings) {
        hero.spirit_scaling = {};
        for (const [key, value] of Object.entries(spiritScalings)) {
          if ((value as any).eScalingStat === 'ETechPower') {
            hero.spirit_scaling[key.toLowerCase()] = (value as any).flScale;
          }
        }
      }

      // Weapon Stats
      const weaponPrimId = abilities['ESlot_Weapon_Primary'];
      if (weaponPrimId && abilitiesData[weaponPrimId]?.m_WeaponInfo) {
        const w = abilitiesData[weaponPrimId].m_WeaponInfo;
        hero.weapon_stats = {
          bullet_damage: w.m_flBulletDamage,
          rounds_per_second: 1 / w.m_flCycleTime,
          clip_size: w.m_iClipSize,
          reload_time: w.m_reloadDuration,
          reload_movespeed: w.m_flReloadMoveSpeed / 10000,
          reload_delay: w.m_flReloadSingleBulletsInitialDelay || 0,
          reload_single: w.m_bReloadSingleBullets || false,
          bullet_speed: w.m_BulletSpeedCurve.m_spline[0].y / ENGINE_UNITS_PER_METER,
          falloff_start_range: w.m_flDamageFalloffStartRange / ENGINE_UNITS_PER_METER,
          falloff_end_range: w.m_flDamageFalloffEndRange / ENGINE_UNITS_PER_METER,
          falloff_start_scale: w.m_flDamageFalloffStartScale,
          falloff_end_scale: w.m_flDamageFalloffEndScale,
          falloff_bias: w.m_flDamageFalloffBias,
          bullet_gravity_scale: w.m_flBulletGravityScale,
          bullets_per_shot: w.m_iBullets,
          bullets_per_burst: w.m_iBurstShotCount || 1,
          burst_inter_shot_interval: w.m_flIntraBurstCycleTime || 0,
          dps: calculateDPS(w, 'burst'),
          sustained_dps: calculateDPS(w, 'sustained'),
          weapon_name: weaponPrimId,
          weapon_description: weaponPrimId.replace('citadel_weapon_', 'citadel_weapon_hero_')
        };

        // Add weapon types if available
        const shopUiWeaponStats = (heroData as any).m_ShopStatDisplay?.m_eWeaponStatsDisplay;
        if (shopUiWeaponStats?.m_eWeaponAttributes) {
          hero.weapon_stats.weapon_types = shopUiWeaponStats.m_eWeaponAttributes
            .split(' | ')
            .map((wtype: string) => 'Attribute_' + wtype);
        }
      }

      // Lore, Playstyle, and Role
      hero.lore = localisationData[heroName + '_lore'] || null;
      hero.playstyle = localisationData[heroName + '_playstyle'] || null;
      hero.role = localisationData[heroName + '_role'] || null;

      // Recommended Items
      if ((heroData as any).m_RecommendedUpgrades) {
        hero.recommended_items = (heroData as any).m_RecommendedUpgrades;
      }

      consolidatedData[cleanHeroName] = hero;
      console.log(`Processed hero: ${cleanHeroName}`);
    } catch (error) {
      console.error(`Error processing hero ${cleanHeroName}:`, error);
    }
  }

  // Write consolidated data
  const consolidatedFile = path.join(outputBaseDir, 'all_hero_data.json');
  try {
    fs.writeFileSync(
      consolidatedFile,
      JSON.stringify(consolidatedData, null, 2)
    );
    console.log(`Consolidated hero data written to: ${consolidatedFile}`);
  } catch (error) {
    console.error('Error writing consolidated data:', error);
  }
}

function calculateDPS(weaponInfo: any, type: 'burst' | 'sustained'): number {
  const cycleTime = 1 / (1 / weaponInfo.m_flCycleTime);
  const totalCycleTime = cycleTime + (weaponInfo.m_iBurstShotCount || 1) * (weaponInfo.m_flIntraBurstCycleTime || 0);
  const damage = weaponInfo.m_flBulletDamage * weaponInfo.m_iBullets * (weaponInfo.m_iBurstShotCount || 1);

  if (type === 'burst') {
    return damage / totalCycleTime;
  } else {
    const timeToReload = weaponInfo.m_bReloadSingleBullets 
      ? weaponInfo.m_reloadDuration * weaponInfo.m_iClipSize 
      : weaponInfo.m_reloadDuration;
    const totalReloadTime = timeToReload + (weaponInfo.m_flReloadSingleBulletsInitialDelay || 0);
    const timeToEmptyClip = (weaponInfo.m_iClipSize / (weaponInfo.m_iBurstShotCount || 1)) * totalCycleTime;
    const damageFromClip = weaponInfo.m_flBulletDamage * weaponInfo.m_iBullets * weaponInfo.m_iClipSize;
    return damageFromClip / (timeToEmptyClip + totalReloadTime);
  }
}
