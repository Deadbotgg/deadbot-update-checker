interface DataProperty {
  name: string;
  [key: string]: any;
}

interface TooltipProperty {
  name: string;
  requiresUpgrade?: boolean;
  statusEffect?: DataProperty;
  isShown?: boolean;
  data?: any;
}

interface TooltipSection {
  name: string;
  properties: TooltipProperty[];
  upgradeRequired?: DataProperty;
  basicProperties?: TooltipProperty[];
  data?: any;
}

export interface ConvertedAbility {
  tooltipDetails: TooltipSection[];
  abilityProperties: Record<string, DataProperty>;
}

function convertAbilityData(abilityData: any): ConvertedAbility {
  const convertedAbility: ConvertedAbility = {
    tooltipDetails: [],
    abilityProperties: {},
  };

  if (abilityData.m_AbilityTooltipDetails) {
    convertedAbility.tooltipDetails = convertTooltipDetails(
      abilityData.m_AbilityTooltipDetails,
      abilityData
    );
  }

  if (abilityData.m_mapAbilityProperties) {
    convertedAbility.abilityProperties = convertAbilityProperties(
      abilityData.m_mapAbilityProperties
    );
  }

  return convertedAbility;
}

function convertTooltipDetails(
  tooltipDetails: any,
  abilityData: any
): TooltipSection[] {
  const result: TooltipSection[] = [];

  for (const section of tooltipDetails.m_vecAbilityInfoSections) {
    const convertedSection: TooltipSection = {
      name: section.m_strLocString || '',
      properties: [],
    };

    if (section.m_vecAbilityPropertiesBlock) {
      for (const block of section.m_vecAbilityPropertiesBlock) {
        if (block.m_strPropertiesTitleLocString) {
          const subSection: TooltipSection = {
            name: block.m_strPropertiesTitleLocString,
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
): TooltipProperty[] {
  return properties.map((prop) => {
    const propertyName = prop.m_strImportantProperty || prop.m_strPropertyName;
    const dataProperty = getDataPropertyFromAbility(abilityData, propertyName);
    return {
      name: propertyName,
      requiresUpgrade: prop.m_bRequiresAbilityUpgrade || undefined,
      statusEffect: prop.m_strStatusEffectValue
        ? getDataPropertyFromAbility(abilityData, prop.m_strStatusEffectValue)
        : undefined,
      isShown:
        prop.m_bShowPropertyValue !== undefined
          ? prop.m_bShowPropertyValue
          : undefined,
      data: dataProperty,
    };
  });
}

function convertAbilityProperties(
  abilityProperties: Record<string, any>
): Record<string, DataProperty> {
  const convertedProperties: Record<string, DataProperty> = {};
  for (const [key, value] of Object.entries(abilityProperties)) {
    convertedProperties[key] = getDataPropertyFromAbility(
      { m_mapAbilityProperties: { [key]: value } },
      key
    );
  }
  return convertedProperties;
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
  return {
    name: key,
    ...data,
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

  // Remove m_str and m_subclass prefixes 
  let newKey = key.replace(/^m_(str|subclass)/, '');

  // Convert to camelCase 
  // NOTE: This is a naive implementation
  newKey = newKey.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

  // Ensure the first character is lowercase
  return newKey.charAt(0).toLowerCase() + newKey.slice(1);
}

export function convertAbility(
  abilitiesData: Record<string, any>,
  abilityKey: string
): ConvertedAbility {
  const ability = abilitiesData[abilityKey];
  if (ability) {
    return convertAbilityData(ability);
  } else {
    throw new Error(`Unable to find ${abilityKey} in the abilities data.`);
  }
}
