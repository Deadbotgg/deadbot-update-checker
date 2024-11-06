import fs from 'fs';
import path from 'path';
import {
  getAbilityActivation,
  getShopFilter,
  getSlotType,
  getTargetType,
  getTier,
  KEYBIND_MAP,
} from './utils/maps';
import { formatDescription } from './utils/stringUtils';

export interface ItemData {
  // Basic item information
  Name: string | null;
  Description: string | null;
  Cost: string;
  Tier: string | null;
  Activation: string;
  Slot: string | null;
  Components: string[] | null;
  TargetTypes: string[] | null;
  ShopFilters: string[] | null;
  Disabled: boolean;

  // Ability-related properties
  AbilityCooldown: string;
  AbilityDuration: string;
  AbilityCastRange: string;
  AbilityUnitTargetLimit: string;
  AbilityCastDelay: string;
  AbilityChannelTime: string;
  AbilityPostCastDuration: string;
  AbilityCharges: string;
  AbilityCooldownBetweenCharge: string;
  ChannelMoveSpeed: string;
  AbilityResourceCost: string;

  // Core stats
  TechPower: string;
  WeaponPower: string;

  // Optional stat modifiers
  [key: string]: string | number | boolean | string[] | null;
}

// Helper type for specific stat modifiers that appear in items
export interface ItemStatModifiers {
  // Movement related
  BonusMoveSpeed?: string;
  BonusSprintSpeed?: string;
  SlowPercent?: string;
  MovementSpeedSlow?: string;

  // Combat stats
  BonusHealth?: string;
  BonusHealthRegen?: string;
  BulletResist?: string;
  TechResist?: string;
  BaseAttackDamagePercent?: string;
  BonusFireRate?: string;
  BonusClipSize?: string;
  BonusClipSizePercent?: string;

  // Shield related
  BulletShieldMaxHealth?: string;
  TechShieldMaxHealth?: string;

  // Lifesteal
  BulletLifestealPercent?: string;
  AbilityLifestealPercentHero?: string;

  // Cooldown and duration modifiers
  CooldownReduction?: string;
  BonusAbilityDurationPercent?: string;

  // Special effects
  SlowDuration?: string;
  FireRateSlow?: string;
  DamageReduction?: string;
  HealAmount?: string;
  SpiritDamage?: string;
}

interface AbilityProperty {
  m_strValue: string;
}

interface ItemValue {
  m_eAbilityType?: string;
  m_mapAbilityProperties: { [key: string]: AbilityProperty };
  m_nAbilityTargetTypes?: string;
  m_eShopFilters?: string;
  m_iItemTier?: number;
  m_eAbilityActivation: string;
  m_eItemSlotType?: string;
  m_bDisabled?: boolean | string;
  m_vecComponentItems?: string[];
}

interface GenericData {
  m_nItemPricePerTier: number[];
  [key: string]: unknown;
}

function formatPipeSepString(
  pipeSepString: string,
  mapFunc: (value: string) => string
): string[] {
  const outputArray: string[] = [];
  for (const value of pipeSepString.split('|')) {
    const cleanValue = value.replace(/\s/g, '');
    if (cleanValue === '') {
      continue;
    }
    const mappedValue = mapFunc(cleanValue);
    outputArray.push(mappedValue);
  }
  return outputArray;
}

function snakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

export function collateItemData(outputBaseDir: string): void {
  console.log('Collating item data...');

  const genericFile = path.join(outputBaseDir, 'scripts', 'generic_data.json');
  const abilitiesFile = path.join(outputBaseDir, 'scripts', 'abilities.json');
  const localisationFile = path.join(
    outputBaseDir,
    'localisation',
    'citadel_mods_english.json'
  );
  const gcLocalisationFile = path.join(
    outputBaseDir,
    'localisation',
    'citadel_gc_english.json'
  );

  function parseItem(key: string): any {
    const ability = abilitiesData[key];
    const itemValue = ability;
    const itemAbilityAttrs = itemValue.m_mapAbilityProperties;

    // Assign target types
    let targetTypes = null;
    if (itemValue.m_nAbilityTargetTypes) {
      targetTypes = formatPipeSepString(
        itemValue.m_nAbilityTargetTypes,
        getTargetType
      );
    }

    // Assign shop filters
    let shopFilters = null;
    if (itemValue.m_eShopFilters) {
      shopFilters = formatPipeSepString(
        itemValue.m_eShopFilters,
        getShopFilter
      );
    }

    const tier = getTier(itemValue.m_iItemTier);
    let cost = null;
    if (tier !== null) {
      cost = (genericData as GenericData).m_nItemPricePerTier[parseInt(tier)];
    }

    const parsedItemData: any = {
      name: localisationData[key] || gcLocalisationData[key],
      description: '',
      cost: String(cost),
      tier: tier,
      activation: getAbilityActivation(itemValue.m_eAbilityActivation),
      slot: getSlotType(itemValue.m_eItemSlotType),
      components: null,
      target_types: targetTypes,
      shop_filters: shopFilters,
      disabled: isDisabled(itemValue),
    };

    for (const [attrKey, attrValue] of Object.entries(itemAbilityAttrs)) {
      parsedItemData[snakeCase(attrKey)] = (attrValue as { m_strValue: string }).m_strValue;
    }

    // ignore description formatting for disabled items
    const description = localisationData[`${key}_desc`];
    if (!parsedItemData.Disabled) {
      parsedItemData.description = formatDescription(
        description || '',
        parsedItemData,
        KEYBIND_MAP
      );
    } else {
      parsedItemData.description = description;
    }

    if (itemValue.m_vecComponentItems) {
      parsedItemData.components = itemValue.m_vecComponentItems;
      let parentName = parsedItemData.Name;
      if (parentName === null) {
        parentName = key;
      }
    }

    return parsedItemData;
  }

  function isDisabled(item: ItemValue): boolean {
    if ('m_bDisabled' in item) {
      const flag = item.m_bDisabled;
      if (flag === true || flag === 'true') {
        return true;
      } else if (flag === false || flag === 'false') {
        return false;
      } else {
        throw new Error(`New unexpected value for m_bDisabled: ${flag}`);
      }
    }
    return false;
  }

  if (
    !fs.existsSync(genericFile) ||
    !fs.existsSync(abilitiesFile) ||
    !fs.existsSync(localisationFile)
  ) {
    console.error(
      'Required files are missing. Make sure all necessary files have been parsed.'
    );
    console.log('Generics file exists:', fs.existsSync(genericFile));
    console.log('Abilities file exists:', fs.existsSync(abilitiesFile));
    console.log('Localisation file exists:', fs.existsSync(localisationFile));
    return;
  }

  let genericData: GenericData,
    abilitiesData: Record<string, any>,
    localisationData: Record<string, any>,
    gcLocalisationData: Record<string, any>;

  try {
    genericData = JSON.parse(fs.readFileSync(genericFile, 'utf-8'));
    console.log('Generics data parsed successfully');
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

  if (!genericData || typeof genericData !== 'object' || !genericData) {
    console.error('Invalid generic data structure');
    return;
  }

  const consolidatedData: { [key: string]: ItemData } = {};

  // Process heroes
  for (const [itemName, itemData] of Object.entries(abilitiesData)) {
    if (typeof itemData !== 'object') {
      continue;
    }

    if (!itemData.m_eAbilityType) {
      continue;
    }

    if (itemData.m_eAbilityType !== 'EAbilityType_Item') {
      continue;
    }

    try {
      consolidatedData[itemName] = parseItem(itemName);
    } catch (e) {
      // throw new Error(`[ERROR] Failed to parse item ${itemName}: ${e}`);
    }
  }

  // Write consolidated data
  const consolidatedFile = path.join(outputBaseDir, 'all_item_data.json');
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
