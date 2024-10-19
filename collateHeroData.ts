import fs from 'fs';
import path from 'path';

interface HeroData {
  id: number;
  new_player_friendly: boolean;
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
  abilities: string[];
  level_upgrades: { [key: string]: string | null };
}

export function collateHeroData(outputBaseDir: string): void {
  console.log('Collating hero data...');

  const heroesFile = path.join(outputBaseDir, 'data', 'heroes.json');
  const abilitiesFile = path.join(outputBaseDir, 'data', 'abilities.json');
  const localisationFile = path.join(outputBaseDir, 'data', 'citadel_heroes_english.txt.json');

  if (!fs.existsSync(heroesFile) || !fs.existsSync(abilitiesFile) || !fs.existsSync(localisationFile)) {
    console.error('Required files are missing. Make sure all necessary files have been parsed.');
    console.log('Heroes file exists:', fs.existsSync(heroesFile));
    console.log('Abilities file exists:', fs.existsSync(abilitiesFile));
    console.log('Localisation file exists:', fs.existsSync(localisationFile));
    return;
  }

  let heroesData, abilitiesData, localisationData;

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

  if (!heroesData || typeof heroesData !== 'object' || !heroesData) {
    console.error('Invalid heroes data structure');
    // console.log('Heroes data:', JSON.stringify(heroesData, null, 2));
    return;
  }

  const consolidatedData: { [key: string]: HeroData } = {};

  // Process heroes
  for (const [heroName, heroData] of Object.entries(heroesData)) {
    if (!heroName.startsWith('hero_')) continue;

    const cleanHeroName = heroName.replace('hero_', '');
    // const heroDir = path.join(outputBaseDir, 'heroes', cleanHeroName);

    // if (!fs.existsSync(heroDir)) {
    //   console.log(`Hero directory not found for ${cleanHeroName}, skipping`);
    //   continue;
    // }

    try {
      const hero: HeroData = {
        id: (heroData as any)['m_HeroID'],
        new_player_friendly: (heroData as any)['m_bNewPlayerFriendly'] || false,
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

      // Ability Data
      for (const ability of hero.abilities) {
        if (ability) {
          const abilityData = abilitiesData[ability];
          if (abilityData) {
            const abilityName = abilityData['m_AbilityName'];
            if (abilityName) {
              hero.abilities.push(abilityName);
            }
          }
        }
      }

      // Level upgrades
      const standardLevelUpgrades = (heroData as any)['m_mapStandardLevelUpUpgrades'];
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
  const consolidatedFile = path.join(outputBaseDir, 'consolidated_hero_data.json');
  try {
    fs.writeFileSync(consolidatedFile, JSON.stringify(consolidatedData, null, 2));
    console.log(`Consolidated hero data written to: ${consolidatedFile}`);
  } catch (error) {
    console.error('Error writing consolidated data:', error);
  }
}
