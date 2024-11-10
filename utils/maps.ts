import type { AttrMapEntry } from '@deadbot/types';

export function getScaleType(scaleType: string | undefined): string {
  if (!scaleType) return 'Unknown';

  const scaleTypeMap: { [key: string]: string } = {
    ETechPower: 'spirit',
    ELightMeleeDamage: 'melee',
    ETechRange: 'range',
    ETechCooldown: 'cooldown',
    EBulletDamage: 'damage',
    ETechDuration: 'duration',
    EWeaponDamageScale: 'weapon_damage',
  };

  return scaleTypeMap[scaleType] || scaleType;
}

export function getHeroAttr(key: string): string {
  const attrMap: { [key: string]: string } = {
    EMaxMoveSpeed: 'MaxMoveSpeed',
    ESprintSpeed: 'SprintSpeed',
    ECrouchSpeed: 'CrouchSpeed',
    EMoveAcceleration: 'MoveAcceleration',
    ELightMeleeDamage: 'LightMeleeDamage',
    EHeavyMeleeDamage: 'HeavyMeleeDamage',
    EMaxHealth: 'MaxHealth',
    EWeaponPower: 'WeaponPower',
    EReloadSpeed: 'ReloadSpeed',
    EWeaponPowerScale: 'WeaponPowerScale',
    EStamina: 'Stamina',
    EBaseHealthRegen: 'BaseHealthRegen',
    EStaminaRegenPerSecond: 'StaminaRegenPerSecond',
    EBulletDamage: 'BulletDamage',
  };

  return attrMap[key] || key;
}

export function getBoundAbilities(key: string): string {
  const abilityMap: { [key: string]: string } = {
    ESlot_Signature_1: 'Signature1',
    ESlot_Signature_2: 'Signature2',
    ESlot_Signature_3: 'Signature3',
    ESlot_Signature_4: 'Signature4',
    ESlot_Ultimate: 'Ultimate',
    ESlot_Weapon_Primary: 'WeaponPrimary',
  };

  return abilityMap[key] || key;
}

export function getLevelMod(key: string): string {
  const modMap: { [key: string]: string } = {
    MODIFIER_VALUE_BASE_BULLET_DAMAGE_FROM_LEVEL: 'BulletDamage',
    MODIFIER_VALUE_BASE_MELEE_DAMAGE_FROM_LEVEL: 'MeleeDamage',
    MODIFIER_VALUE_BASE_HEALTH_FROM_LEVEL: 'MaxHealth',
    MODIFIER_VALUE_TECH_DAMAGE_PERCENT: 'TechDamagePerc',
    MODIFIER_VALUE_TECH_ARMOR_DAMAGE_RESIST: 'TechResist',
    MODIFIER_VALUE_BULLET_ARMOR_DAMAGE_RESIST: 'BulletResist',
    MODIFIER_VALUE_BONUS_ATTACK_RANGE: 'BonusAttackRange',
  };

  return modMap[key] || key;
}

export function getTargetType(value: string): string {
  const targetTypeMap: { [key: string]: string } = {
    CITADEL_UNIT_TARGET_ALL_ENEMY: 'AllEnemy',
    CITADEL_UNIT_TARGET_ALL_FRIENDLY: 'AllFriendly',
    CITADEL_UNIT_TARGET_CREEP_ENEMY: 'CreepEnemy',
    CITADEL_UNIT_TARGET_HERO_ENEMY: 'HeroEnemy',
    CITADEL_UNIT_TARGET_HERO_FRIENDLY: 'HeroFriendly',
    CITADEL_UNIT_TARGET_HERO: 'Hero',
    CITADEL_UNIT_TARGET_MINION_ENEMY: 'MinionEnemy',
    CITADEL_UNIT_TARGET_MINION_FRIENDLY: 'MinionFriendly',
    CITADEL_UNIT_TARGET_NEUTRAL: 'Neutral',
    CITADEL_UNIT_TARGET_PROP_ENEMY: 'PropEnemy',
    CITADEL_UNIT_TARGET_TROOPER_ENEMY: 'TrooperEnemy',
    CITADEL_UNIT_TARGET_TROPHY_ENEMY: 'TrophyEnemy',
  };

  return targetTypeMap[value] || value;
}

export function getShopFilter(value: string): string {
  const shopFilterMap: { [key: string]: string } = {
    EShopFilter_Consumable: 'Consumable',
    EShopFilter_Attribute: 'Attribute',
    EShopFilter_Armor: 'Armor',
    EShopFilter_Weapon: 'Weapon',
    EShopFilter_Misc: 'Misc',
  };

  return shopFilterMap[value] || value;
}

export function getTier(value: number | undefined): string | null {
  if (value === undefined) return null;
  return String(value).replace('EModTier_', '');
}

export function getAbilityActivation(value: string): string {
  const activationMap: { [key: string]: string } = {
    CITADEL_ABILITY_ACTIVATION_INSTANT_CAST: 'InstantCast',
    CITADEL_ABILITY_ACTIVATION_PASSIVE: 'Passive',
    CITADEL_ABILITY_ACTIVATION_PRESS: 'ActivationPress',
  };

  return activationMap[value] || value;
}

export function getSlotType(value: string | undefined): string {
  if (!value) return 'None';

  const slotTypeMap: { [key: string]: string } = {
    EItemSlotType_WeaponMod: 'Weapon',
    EItemSlotType_Armor: 'Armor',
    EItemSlotType_Tech: 'Tech',
  };

  return slotTypeMap[value] || value;
}

export function getShopAttrGroup(category: string): string {
  const groupMap: { [key: string]: string } = {
    m_eWeaponStatsDisplay: 'Weapon',
    m_eVitalityStatsDisplay: 'Vitality',
    m_eSpiritStatsDisplay: 'Spirit',
  };

  return groupMap[category] || category;
}

export function getAttrManualMap(): { [key: string]: AttrMapEntry } {
  return {
    BulletDamage: {
      label: 'StatDesc_BulletDamage',
      postfix: 'StatDesc_BulletDamage_postfix',
    },
    MaxHealth: {
      label: 'StatDesc_MaxHealth',
      postfix: 'StatDesc_MaxHealth_postfix',
    },
    BaseHealthRegen: {
      label: 'StatDesc_BaseHealthRegen',
      postfix: 'StatDesc_BaseHealthRegen_postfix',
    },
    MaxMoveSpeed: {
      label: 'StatDesc_MaxMoveSpeed',
      postfix: 'StatDesc_MaxMoveSpeed_postfix',
    },
    WeaponPower: {
      label: 'StatDesc_WeaponPower',
      postfix: 'StatDesc_WeaponPower_postfix',
    },
  };
}

export const KEYBIND_MAP: { [key: string]: string } = {
  '%ability1%': 'Q',
  '%ability2%': 'W',
  '%ability3%': 'E',
  '%ability4%': 'R',
  '%ultimate%': 'F',
  '%attack%': 'LMB',
  '%block%': 'RMB',
  '%jump%': 'SPACE',
  '%sprint%': 'SHIFT',
  '%crouch%': 'CTRL',
};
