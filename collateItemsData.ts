import type {
  ItemData,
  ItemTooltipSection
} from '@deadbot/types';
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

interface AbilityProperty {
  m_strValue: string;
  m_strCSSClass?: string;
  m_bIsNegativeAttribute?: boolean;
  m_UsageFlags?: string;
}

interface ItemValue {
  m_eAbilityType?: string;
  m_mapAbilityProperties: { [key: string]: AbilityProperty };
  m_nAbilityTargetTypes?: string;
  m_eShopFilters?: string;
  m_iItemTier?: number;
  m_eAbilityActivation: string;
  m_eItemSlotType?: string;
  m_bDisabled?: boolean | string | number;
  m_vecComponentItems?: string[];
  m_strAbilityImage?: string;
  m_vecTooltipSectionInfo?: Array<{
    m_eAbilitySectionType?: string;
    m_vecSectionAttributes: Array<{
      m_vecElevatedAbilityProperties?: string[];
      m_vecAbilityProperties?: string[];
      m_strLocString?: string;
      m_vecImportantAbilityProperties?: Array<{
        m_strImportantProperty: string;
      }>;
    }>;
  }>;
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

function parseImagePath(imagePath: string | undefined): string | null {
  if (!imagePath) return null;
  
  // Remove the panorama prefix, file prefix, and any quotes
  const cleanPath = imagePath
    .replace(/^panorama:"?file:\/\/\{images\}\//, '')
    .replace(/"$/, '');
  
  // Split the path and filename
  const lastSlashIndex = cleanPath.lastIndexOf('/');
  const directory = lastSlashIndex !== -1 ? cleanPath.substring(0, lastSlashIndex) : '';
  const filename = lastSlashIndex !== -1 ? cleanPath.substring(lastSlashIndex + 1) : cleanPath;
  
  // Remove the extension and add _psd.png
  const nameWithoutExt = filename.replace(/\.psd$/, '');
  
  // Combine directory and new filename
  return directory ? `${directory}/${nameWithoutExt}_psd` : `${nameWithoutExt}_psd`;
}

function parseTooltipSections(
  itemValue: ItemValue,
  localisationData: any
): { [key: string]: ItemTooltipSection[] } {
  const tooltipSections: { [key: string]: ItemTooltipSection[] } = {};
  const abilityProps = itemValue.m_mapAbilityProperties;

  if (itemValue.m_vecTooltipSectionInfo) {
    for (const section of itemValue.m_vecTooltipSectionInfo) {
      // Handle case where section type is undefined
      const sectionType = section.m_eAbilitySectionType
        ? section.m_eAbilitySectionType.replace('EArea_', '')
        : 'Default';
      tooltipSections[sectionType] = [];

      for (const attr of section.m_vecSectionAttributes) {
        const descriptionKey =
          String(attr.m_strLocString)?.replace('#', '') || '';
        const tooltipSection: ItemTooltipSection = {
          ability_properties: {},
          elevated_ability_properties: {},
          important_ability_properties: {},
          description: unescapeString(localisationData[descriptionKey]) || '',
        };

        // Regular ability properties
        if (attr.m_vecAbilityProperties) {
          for (const prop of attr.m_vecAbilityProperties) {
            const abilityProp = abilityProps[prop];
            if (abilityProp) {
              tooltipSection.ability_properties[snakeCase(prop)] = {
                value: parseInt(abilityProp.m_strValue, 10),
                style: abilityProp.m_strCSSClass || null,
                is_negative: abilityProp.m_bIsNegativeAttribute || false,
              };
            }
          }
        }

        // Elevated ability properties
        if (attr.m_vecElevatedAbilityProperties) {
          for (const prop of attr.m_vecElevatedAbilityProperties) {
            const abilityProp = abilityProps[prop];
            if (abilityProp) {
              tooltipSection.elevated_ability_properties[snakeCase(prop)] = {
                value: parseInt(abilityProp.m_strValue, 10),
                style: abilityProp.m_strCSSClass || null,
                is_negative: abilityProp.m_bIsNegativeAttribute || false,
              };
            }
          }
        }

        // Important ability properties
        if (attr.m_vecImportantAbilityProperties) {
          for (const {
            m_strImportantProperty: prop,
          } of attr.m_vecImportantAbilityProperties) {
            const abilityProp = abilityProps[prop];
            if (abilityProp) {
              tooltipSection.important_ability_properties[snakeCase(prop)] = {
                value: parseInt(abilityProp.m_strValue, 10),
                style: abilityProp.m_strCSSClass || null,
                is_conditional: (abilityProp.m_UsageFlags || '').includes(
                  'APUsageFlag_ModifierConditional'
                ),
              };
            }
          }
        }

        tooltipSections[sectionType].push(tooltipSection);
      }
    }
  }

  return tooltipSections;
}

function unescapeString(str: string): string {
  try {
    return JSON.parse(`"${str.replace(/^"|"$/g, '')}"`);
  } catch {
    return str;
  }
}

function parseItem(
  key: string,
  abilitiesData: Record<string, any>,
  genericData: GenericData,
  localisationData: Record<string, any>,
  gcLocalisationData: Record<string, any>
): ItemData {
  const ability = abilitiesData[key];
  const itemValue = ability as ItemValue;
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
    shopFilters = formatPipeSepString(itemValue.m_eShopFilters, getShopFilter);
  }

  const tier = getTier(itemValue.m_iItemTier);
  let cost = null;
  if (tier !== null) {
    cost = (genericData as GenericData).m_nItemPricePerTier[parseInt(tier)];
  }

  const rawDescription = localisationData[`${key}_desc`];
  const description = rawDescription ? unescapeString(rawDescription) : null;
  const tooltipSections = parseTooltipSections(itemValue, {
    ...localisationData,
    ...gcLocalisationData,
  });

  const parsedItemData: ItemData = {
    name: gcLocalisationData[key] || localisationData[key],
    description: !isDisabled(itemValue)
      ? formatDescription(description || '', {}, KEYBIND_MAP)
      : description,
    cost: String(cost),
    tier: tier,
    activation: getAbilityActivation(itemValue.m_eAbilityActivation),
    slot: getSlotType(itemValue.m_eItemSlotType),
    image: parseImagePath(itemValue.m_strAbilityImage),
    components:
      itemValue.m_vecComponentItems?.map((component) => {
        const componentAbility = abilitiesData[component] as ItemValue;
        return {
          key: component,
          name: gcLocalisationData[component] || localisationData[component],
          image: parseImagePath(componentAbility?.m_strAbilityImage),
        };
      }) || null,
    componentsOf: [], // Initialize empty array, will be populated later
    target_types: targetTypes,
    shop_filters: shopFilters,
    tooltip: tooltipSections,
    disabled: isDisabled(itemValue),
    ability_cooldown: parseFloat(
      itemAbilityAttrs.AbilityCooldown?.m_strValue || '0'
    ),
    ability_duration: parseFloat(
      itemAbilityAttrs.AbilityDuration?.m_strValue || '0'
    ),
    ability_cast_range: parseFloat(
      itemAbilityAttrs.AbilityCastRange?.m_strValue || '0'
    ),
    ability_unit_target_limit: parseFloat(
      itemAbilityAttrs.AbilityUnitTargetLimit?.m_strValue || '0'
    ),
    ability_cast_delay: parseFloat(
      itemAbilityAttrs.AbilityCastDelay?.m_strValue || '0'
    ),
    ability_channel_time: parseFloat(
      itemAbilityAttrs.AbilityChannelTime?.m_strValue || '0'
    ),
    ability_post_cast_duration: parseFloat(
      itemAbilityAttrs.AbilityPostCastDuration?.m_strValue || '0'
    ),
    ability_charges: parseFloat(
      itemAbilityAttrs.AbilityCharges?.m_strValue || '0'
    ),
    ability_cooldown_between_charge: parseFloat(
      itemAbilityAttrs.AbilityCooldownBetweenCharge?.m_strValue || '0'
    ),
    channel_move_speed: parseFloat(
      itemAbilityAttrs.ChannelMoveSpeed?.m_strValue || '0'
    ),
    ability_resource_cost: parseFloat(
      itemAbilityAttrs.AbilityResourceCost?.m_strValue || '0'
    ),
    tech_power: parseFloat(itemAbilityAttrs.TechPower?.m_strValue || '0'),
    weapon_power: parseFloat(itemAbilityAttrs.WeaponPower?.m_strValue || '0'),
  };

  // Add any additional ability properties as snake_case
  for (const [attrKey, attrValue] of Object.entries(itemAbilityAttrs) as [
    string,
    AbilityProperty
  ][]) {
    if (
      !attrKey.startsWith('Ability') &&
      !['TechPower', 'WeaponPower', 'ChannelMoveSpeed'].includes(attrKey)
    ) {
      const snakeCaseKey = snakeCase(attrKey);
      parsedItemData[snakeCaseKey] = parseFloat(attrValue.m_strValue);
    }
  }

  return parsedItemData;
}

function isDisabled(item: ItemValue): boolean {
  if ('m_bDisabled' in item) {
    const flag = item.m_bDisabled;
    if (flag === true || flag === 'true' || flag === 1) {
      return true;
    } else if (flag === false || flag === 'false' || flag === 0) {
      return false;
    } else {
      console.warn(
        `Unexpected value for m_bDisabled: ${flag}, treating as false`
      );
      return false;
    }
  }
  return false;
}

function getItemCategory(key: string): string {
  if (key.startsWith('upgrade_')) return 'upgrades';
  if (key.startsWith('ability_')) return 'abilities';
  if (key.startsWith('armor_')) return 'armor';
  if (key.startsWith('weapon_')) return 'weapons';
  if (key.startsWith('tech_')) return 'tech';
  return 'misc';
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

  // Process items
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
      consolidatedData[itemName] = parseItem(
        itemName,
        abilitiesData,
        genericData,
        localisationData,
        gcLocalisationData
      );
    } catch (e) {
      console.error(`[ERROR] Failed to parse item ${itemName}:`, e);
    }
  }

  // Process componentsOf relationships
  for (const [itemName, itemData] of Object.entries(consolidatedData)) {
    if (itemData.components) {
      for (const item of itemData.components) {
        const componentOf = consolidatedData[item.key];
        if (componentOf) {
          if (!componentOf.componentsOf) {
            componentOf.componentsOf = [];
          }
          componentOf.componentsOf.push({
            key: itemName,
            name: itemData.name || '',
            image: itemData.image,
          });
        }
      }
    }
  }

  // Create category directories
  const categories = ['upgrades'];
  for (const category of categories) {
    const categoryDir = path.join(outputBaseDir, 'items', category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
  }

  // Write individual item files
  for (const [itemName, itemData] of Object.entries(consolidatedData)) {
    const category = getItemCategory(itemName);
    const itemFile = path.join(outputBaseDir, 'items', category, `${itemName}.json`);
    try {
      fs.writeFileSync(itemFile, JSON.stringify(itemData, null, 2));
    } catch (error) {
      console.error(`Error writing item file for ${itemName}:`, error);
    }
  }

  // Write consolidated data
  const consolidatedFile = path.join(outputBaseDir, 'all_item_data.json');
  try {
    fs.writeFileSync(
      consolidatedFile,
      JSON.stringify(consolidatedData, null, 2)
    );
    console.log(`Consolidated item data written to: ${consolidatedFile}`);
  } catch (error) {
    console.error('Error writing consolidated data:', error);
  }
}
