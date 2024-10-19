import fs from 'fs';
import path from 'path';
import {
  convertAbility,
  type ConvertedAbility,
} from './generic_ability_parser';

interface HeroData {
  id: number;
  new_player_friendly: boolean;
  name: string;
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
  };
  abilities: string[] | ConvertedAbility[];
  level_upgrades: { [key: string]: string | null };
}

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
    if (!heroName.startsWith('hero_')) continue;

    const cleanHeroName = heroName.replace('hero_', '');

    try {
      const hero: HeroData = {
        id: (heroData as any)['m_HeroID'],
        name: gcLocalisationData['Steam_RP_' + heroName] || heroName,
        new_player_friendly: (heroData as any)['m_bNewPlayerFriendly'] || false,
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
        },
        abilities: [],
        level_upgrades: {},
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
        ...convertAbility(abilitiesData, ability),
      })) as ConvertedAbility[];

      // Level upgrades
      const standardLevelUpgrades = (heroData as any)[
        'm_mapStandardLevelUpUpgrades'
      ];
      for (const [key, value] of Object.entries(standardLevelUpgrades)) {
        hero.level_upgrades[key.toLowerCase()] = value as string;
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
