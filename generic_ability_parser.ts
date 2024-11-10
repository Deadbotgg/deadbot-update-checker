import type {
  AbilitySpiritScaling,
  AbilityStats,
  AbilityTooltipProperty,
  AbilityTooltipSection,
  ConvertedAbility,
  DataProperty,
  ScaleFunction
} from '@deadbot/types';
import { getScaleType } from './utils/maps';

function snakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

function extractSpiritScaling(
  abilityData: any
): AbilitySpiritScaling | undefined {
  if (!abilityData.m_mapScalingStats) return undefined;

  const scaling: AbilitySpiritScaling = {};
  const scalings = abilityData.m_mapScalingStats;

  for (const [key, value] of Object.entries(scalings)) {
    if ((value as any).eScalingStat === 'ETechPower') {
      const scale = (value as any).flScale;
      if (key.includes('Damage')) scaling.damage_scaling = scale;
      if (key.includes('Duration')) scaling.duration_scaling = scale;
      if (key.includes('Range')) scaling.range_scaling = scale;
      if (key.includes('Cooldown')) scaling.cooldown_scaling = scale;
    }
  }

  return Object.keys(scaling).length > 0 ? scaling : undefined;
}

function extractScaleFunction(raw_attr: any): ScaleFunction | undefined {
  if (raw_attr?.m_subclassScaleFunction || raw_attr?.scale_function) {
    const scaleData =
      raw_attr.m_subclassScaleFunction || raw_attr.scale_function;
    if ('m_fl_stat_scale' in scaleData) {
      return {
        value: scaleData.m_fl_stat_scale,
        type: getScaleType(
          scaleData.m_e_specific_stat_scale_type || 'ETechPower'
        ),
      };
    }
  }
  return undefined;
}

function extractAbilityStats(abilityData: any): AbilityStats {
  const stats: AbilityStats = {};
  const properties = abilityData.m_mapAbilityProperties || {};

  if (properties.AbilityDamage)
    stats.damage = parseFloat(properties.AbilityDamage.m_strValue);
  if (properties.AbilityDuration)
    stats.duration = parseFloat(properties.AbilityDuration.m_strValue);
  if (properties.AbilityCooldown)
    stats.cooldown = parseFloat(properties.AbilityCooldown.m_strValue);
  if (properties.AbilityCastRange)
    stats.range = parseFloat(properties.AbilityCastRange.m_strValue);
  if (properties.AbilityCharges)
    stats.charges = parseInt(properties.AbilityCharges.m_strValue);
  if (properties.AbilityCooldownBetweenCharge) {
    stats.charge_restore_time = parseFloat(
      properties.AbilityCooldownBetweenCharge.m_strValue
    );
  }
  if (properties.AbilityChannelTime)
    stats.channel_duration = parseFloat(
      properties.AbilityChannelTime.m_strValue
    );
  if (properties.AbilityResourceCost)
    stats.resource_cost = parseFloat(properties.AbilityResourceCost.m_strValue);

  const propertiesKeys = Object.keys(properties);

  for (let i = 0; i < propertiesKeys.length; i++) {
    const key = propertiesKeys[i];
    const snakedKey = snakeCase(key.replace('Ability', ''));
    if (stats[snakedKey]) continue;
    stats[snakedKey] = parseFloat(properties[key].m_strValue);
  }

  return stats;
}

function convertAbilityData(
  abilityData: any,
  localisationData: any
): Partial<ConvertedAbility> {
  const convertedAbility: Partial<ConvertedAbility> = {
    tooltipDetails: [],
    stats: extractAbilityStats(abilityData),
  };

  if (abilityData.m_AbilityTooltipDetails) {
    convertedAbility.tooltipDetails = convertTooltipDetails(
      abilityData.m_AbilityTooltipDetails,
      abilityData,
      localisationData
    );
  }

  const spiritScaling = extractSpiritScaling(abilityData);
  if (spiritScaling) {
    convertedAbility.spirit_scaling = spiritScaling;
  }

  return convertedAbility;
}

function convertTooltipDetails(
  tooltipDetails: any,
  abilityData: any,
  localisationData: any
): AbilityTooltipSection[] {
  const result: AbilityTooltipSection[] = [];

  for (const section of tooltipDetails.m_vecAbilityInfoSections) {
    const descKey = !!section.m_strLocString ? section.m_strLocString?.replace('#', '') : undefined;
    const convertedSection: AbilityTooltipSection = {
      description: localisationData[descKey] || descKey,
      properties: [],
    };

    if (section.m_vecAbilityPropertiesBlock) {
      for (const block of section.m_vecAbilityPropertiesBlock) {
        if (block.m_strPropertiesTitleLocString) {
          const blockDescKey = block.m_strPropertiesTitleLocString?.replace(
            '#',
            ''
          );
          const subSection: AbilityTooltipSection = {
            description: localisationData[blockDescKey],
            properties: convertProperties(
              block.m_vecAbilityProperties,
              abilityData
            ),
          };
          if (section.m_strAbilityPropertyUpgradeRequired) {
            subSection.upgradeRequired = getDataPropertyFromAbility(
              abilityData,
              section.m_strAbilityPropertyUpgradeRequired
            );
          }
          result.push(subSection);
        } else {
          convertedSection.properties = convertedSection.properties.concat(
            convertProperties(block.m_vecAbilityProperties, abilityData)
          );
        }
      }
    }

    if (section.m_vecBasicProperties) {
      convertedSection.basicProperties = section.m_vecBasicProperties.map(
        (prop: string) => ({
          ...getDataPropertyFromAbility(abilityData, prop),
        })
      );
    }

    if (section.m_strAbilityPropertyUpgradeRequired) {
      convertedSection.upgradeRequired = getDataPropertyFromAbility(
        abilityData,
        section.m_strAbilityPropertyUpgradeRequired
      );
    }

    if (
      convertedSection.properties.length > 0 ||
      convertedSection.basicProperties?.length ||
      convertedSection.name
    ) {
      result.push(convertedSection);
    }
  }

  return result;
}

function convertProperties(
  properties: any[],
  abilityData: any
): AbilityTooltipProperty[] {
  return properties.map((prop) => {
    const propertyName = prop.m_strImportantProperty || prop.m_strPropertyName;
    const dataProperty = getDataPropertyFromAbility(abilityData, propertyName);
    return {
      ...dataProperty,
      requiresUpgrade: prop.m_bRequiresAbilityUpgrade || undefined,
      statusEffect: prop.m_strStatusEffectValue
        ? getDataPropertyFromAbility(abilityData, prop.m_strStatusEffectValue)
        : undefined,
      isShown:
        prop.m_bShowPropertyValue !== undefined
          ? prop.m_bShowPropertyValue
          : undefined,
    };
  });
}

function getDataFromAbility(abilityData: any, key: string): any {
  if (
    abilityData.m_mapAbilityProperties &&
    abilityData.m_mapAbilityProperties[key]
  ) {
    return transformObject(abilityData.m_mapAbilityProperties[key]);
  }
  return transformObject(abilityData[key]);
}

function getDataPropertyFromAbility(
  abilityData: any,
  key: string
): DataProperty {
  const data = getDataFromAbility(abilityData, key);
  const scaleFunc = extractScaleFunction(data);
  return {
    key,
    ...data,
    scale_function: scaleFunc,
  };
}

function transformObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformObject);
  }

  const transformed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = transformKey(key);
    transformed[newKey] = transformObject(value);
  }

  return transformed;
}

function transformKey(key: string): string {
  let newKey = key.replace(/^m_(str|subclass)/, '');

  if (newKey === 'CSSClass') {
    newKey = 'type';
  }
  // Convert to camelCase
  newKey = snakeCase(newKey);

  return newKey;
}

export function convertAbility(
  abilitiesData: Record<string, any>,
  abilityKey: string,
  localisationData: Record<string, string>
): Partial<ConvertedAbility> {
  const ability = abilitiesData[abilityKey];
  if (ability) {
    return convertAbilityData(ability, localisationData);
  } else {
    throw new Error(`Unable to find ${abilityKey} in the abilities data.`);
  }
}
