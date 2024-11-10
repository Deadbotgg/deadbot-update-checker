import type { ConvertedAbility, HeroData } from '@deadbot/types';
import fs from 'fs';
import path from 'path';
import { convertAbility } from './generic_ability_parser';

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

  // Create heroes directory if it doesn't exist
  const heroesDir = path.join(outputBaseDir, 'heroes');
  if (!fs.existsSync(heroesDir)) {
    fs.mkdirSync(heroesDir, { recursive: true });
  }

  // Process heroes
  for (const [heroName, heroData] of Object.entries(heroesData)) {
    if (
      !heroName.startsWith('hero_') ||
      heroName.endsWith('base') ||
      heroName.endsWith('dummy')
    )
      continue;

    const cleanHeroName = heroName.replace('hero_', '');

    try {
      const hero: HeroData = {
        id: (heroData as any)['m_HeroID'],
        name: gcLocalisationData['Steam_RP_' + heroName] || heroName,
        new_player_friendly:
          (heroData as any)['m_bNewPlayerRecommended'] || false,
        in_development: (heroData as any)['m_bInDevelopment'] || false,
        in_hero_labs: (heroData as any)['m_bAvailableInHeroLabs'] || false,
        is_disabled: (heroData as any)['m_bDisabled'] || false,
        complexity: (heroData as any)['m_nComplexity'] || 1,
        readability: (heroData as any)['m_nReadability'] || 1,
        bot_selectable: (heroData as any)['m_bBotSelectable'] || false,
        lane_testing_recommended:
          (heroData as any)['m_bLaneTestingRecommended'] || false,
        starting_stats: {
          max_move_speed: (heroData as any)['m_mapStartingStats'][
            'EMaxMoveSpeed'
          ],
          sprint_speed: (heroData as any)['m_mapStartingStats']['ESprintSpeed'],
          crouch_speed: (heroData as any)['m_mapStartingStats']['ECrouchSpeed'],
          move_acceleration: (heroData as any)['m_mapStartingStats'][
            'EMoveAcceleration'
          ],
          light_melee_damage: (heroData as any)['m_mapStartingStats'][
            'ELightMeleeDamage'
          ],
          heavy_melee_damage: (heroData as any)['m_mapStartingStats'][
            'EHeavyMeleeDamage'
          ],
          max_health: (heroData as any)['m_mapStartingStats']['EMaxHealth'],
          weapon_power: (heroData as any)['m_mapStartingStats']['EWeaponPower'],
          reload_speed: (heroData as any)['m_mapStartingStats']['EReloadSpeed'],
          weapon_power_scale: (heroData as any)['m_mapStartingStats'][
            'EWeaponPowerScale'
          ],
          stamina: (heroData as any)['m_mapStartingStats']['EStamina'],
          base_health_regen: (heroData as any)['m_mapStartingStats'][
            'EBaseHealthRegen'
          ],
          stamina_regen_per_second: (heroData as any)['m_mapStartingStats'][
            'EStaminaRegenPerSecond'
          ],
          stamina_cooldown:
            1 /
            (heroData as any)['m_mapStartingStats']['EStaminaRegenPerSecond'],
          crit_damage_received_scale:
            ((heroData as any)['m_mapStartingStats'][
              'ECritDamageReceivedScale'
            ] -
              1) *
            100,
          tech_range: (heroData as any)['m_mapStartingStats']['ETechRange'] - 1,
          tech_duration:
            (heroData as any)['m_mapStartingStats']['ETechDuration'] - 1,
        },
        abilities: [],
        level_upgrades: {},
        collision: {
          radius: (heroData as any)['m_flCollisionRadius'],
          height: (heroData as any)['m_flCollisionHeight'],
          step_height: (heroData as any)['m_flStepHeight'],
        },
        movement: {
          stealth_speed: (heroData as any)['m_flStealthSpeedMetersPerSecond'],
          footstep_sound_distance: (heroData as any)[
            'm_flFootstepSoundTravelDistanceMeters'
          ],
          step_sound_time: (heroData as any)['m_flStepSoundTime'],
        },
        visuals: {
          ui_color: (heroData as any)['m_colorUI'],
          glow_colors: {
            friendly: (heroData as any)['m_colorGlowFriendly'],
            enemy: (heroData as any)['m_colorGlowEnemy'],
            team1: (heroData as any)['m_colorGlowTeam1'],
            team2: (heroData as any)['m_colorGlowTeam2'],
          },
          model_skin: (heroData as any)['m_nModelSkin'] || 0,
        },
        item_slots: {
          weapon_mod: {
            max_purchases_per_tier: (heroData as any)['m_mapItemSlotInfo'][
              'EItemSlotType_WeaponMod'
            ]['m_arMaxPurchasesForTier'],
          },
          armor: {
            max_purchases_per_tier: (heroData as any)['m_mapItemSlotInfo'][
              'EItemSlotType_Armor'
            ]['m_arMaxPurchasesForTier'],
          },
          tech: {
            max_purchases_per_tier: (heroData as any)['m_mapItemSlotInfo'][
              'EItemSlotType_Tech'
            ]['m_arMaxPurchasesForTier'],
          },
        },
        purchase_bonuses: {
          weapon_mod: (
            (heroData as any)['m_mapPurchaseBonuses'][
              'EItemSlotType_WeaponMod'
            ] || []
          ).map((bonus: any) => ({
            tier: bonus.m_nTier,
            value: bonus.m_strValue,
            type: bonus.m_ValueType,
          })),
          armor: (
            (heroData as any)['m_mapPurchaseBonuses']['EItemSlotType_Armor'] ||
            []
          ).map((bonus: any) => ({
            tier: bonus.m_nTier,
            value: bonus.m_strValue,
            type: bonus.m_ValueType,
          })),
          tech: (
            (heroData as any)['m_mapPurchaseBonuses']['EItemSlotType_Tech'] ||
            []
          ).map((bonus: any) => ({
            tier: bonus.m_nTier,
            value: bonus.m_strValue,
            type: bonus.m_ValueType,
          })),
        },
        stats_display: {
          health_header_stats:
            (heroData as any)['m_heroStatsDisplay']['m_vecHealthHeaderStats'] ||
            [],
          health_stats:
            (heroData as any)['m_heroStatsDisplay']['m_vecHealthStats'] || [],
          weapon_header_stats:
            (heroData as any)['m_heroStatsDisplay']['m_vecWeaponHeaderStats'] ||
            [],
          weapon_stats:
            (heroData as any)['m_heroStatsDisplay']['m_vecWeaponStats'] || [],
          magic_header_stats:
            (heroData as any)['m_heroStatsDisplay']['m_vecMagicHeaderStats'] ||
            [],
          magic_stats:
            (heroData as any)['m_heroStatsDisplay']['m_vecMagicStats'] || [],
        },
      };

      // Abilities
      const abilities = (heroData as any)['m_mapBoundAbilities'];
      hero.abilities = [
        abilities['ESlot_Signature_1'],
        abilities['ESlot_Signature_2'],
        abilities['ESlot_Signature_3'],
        abilities['ESlot_Signature_4'],
      ];

      const convertedAbilities = (hero.abilities as string[]).map(
        (ability: string) => ({
          key: ability,
          name: localisationData[ability] || ability,
          ...convertAbility(abilitiesData, ability, localisationData),
        })
      ) as ConvertedAbility[];

      hero.abilities = convertedAbilities;

      // Level upgrades
      const standardLevelUpgrades = (heroData as any)[
        'm_mapStandardLevelUpUpgrades'
      ];
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
          bullet_speed:
            w.m_BulletSpeedCurve.m_spline[0].y / ENGINE_UNITS_PER_METER,
          falloff_start_range:
            w.m_flDamageFalloffStartRange / ENGINE_UNITS_PER_METER,
          falloff_end_range:
            w.m_flDamageFalloffEndRange / ENGINE_UNITS_PER_METER,
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
          weapon_description: weaponPrimId.replace(
            'citadel_weapon_',
            'citadel_weapon_hero_'
          ),
        };

        // Add weapon types if available
        const shopUiWeaponStats = (heroData as any).m_ShopStatDisplay
          ?.m_eWeaponStatsDisplay;
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

      // Create hero directory and abilities subdirectory
      const heroDir = path.join(heroesDir, cleanHeroName);
      const abilitiesDir = path.join(heroDir, 'abilities');
      fs.mkdirSync(heroDir, { recursive: true });
      fs.mkdirSync(abilitiesDir, { recursive: true });

      // Write hero data.json (excluding abilities)
      const heroDataFile = path.join(heroDir, 'data.json');
      const { abilities: _, ...heroDataWithoutAbilities } = hero;
      try {
        fs.writeFileSync(
          heroDataFile,
          JSON.stringify(
            {
              ...heroDataWithoutAbilities,
              abilities: convertedAbilities.map((ability) => ({
                key: ability.key,
              })),
            },
            null,
            2
          )
        );
        console.log(`Processed hero data: ${cleanHeroName} -> ${heroDataFile}`);
      } catch (error) {
        console.error(
          `Error writing hero data file for ${cleanHeroName}:`,
          error
        );
      }

      // Write individual ability files
      convertedAbilities.forEach((ability, index) => {
        if (!ability) return;
        const abilityKey = abilities[`ESlot_Signature_${index + 1}`];
        if (!abilityKey) return;

        const cleanAbilityKey = abilityKey.replace('citadel_ability_', '');
        const abilityFile = path.join(abilitiesDir, `${cleanAbilityKey}.json`);
        try {
          fs.writeFileSync(abilityFile, JSON.stringify(ability, null, 2));
          console.log(
            `Processed ability: ${cleanAbilityKey} -> ${abilityFile}`
          );
        } catch (error) {
          console.error(
            `Error writing ability file for ${cleanAbilityKey}:`,
            error
          );
        }
      });
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
  const totalCycleTime =
    cycleTime +
    (weaponInfo.m_iBurstShotCount || 1) *
      (weaponInfo.m_flIntraBurstCycleTime || 0);
  const damage =
    weaponInfo.m_flBulletDamage *
    weaponInfo.m_iBullets *
    (weaponInfo.m_iBurstShotCount || 1);

  if (type === 'burst') {
    return damage / totalCycleTime;
  } else {
    const timeToReload = weaponInfo.m_bReloadSingleBullets
      ? weaponInfo.m_reloadDuration * weaponInfo.m_iClipSize
      : weaponInfo.m_reloadDuration;
    const totalReloadTime =
      timeToReload + (weaponInfo.m_flReloadSingleBulletsInitialDelay || 0);
    const timeToEmptyClip =
      (weaponInfo.m_iClipSize / (weaponInfo.m_iBurstShotCount || 1)) *
      totalCycleTime;
    const damageFromClip =
      weaponInfo.m_flBulletDamage *
      weaponInfo.m_iBullets *
      weaponInfo.m_iClipSize;
    return damageFromClip / (timeToEmptyClip + totalReloadTime);
  }
}
