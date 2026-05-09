import { getActionIcon, getActionName } from './gameData';

const ACTION_IDS_BY_NAME: Record<string, number> = {
  敏銳視野: 235,
  敏銳視野II: 237,
  敏銳視野III: 295,
  環境探知: 218,
  環境探知II: 220,
  環境探知III: 294,
  富礦的饋贈I: 21177,
  富礦的饋贈II: 25589,
  沃土的饋贈I: 21178,
  沃土的饋贈II: 25590,
  明晰視野: 4072,
  植被專精: 4086,
  高產: 4073,
  高產II: 272,
  豐收: 4087,
  豐收II: 273,
  石工之理: 232,
  農夫之智: 215,
  理智同興: 26521,
  '理智同興(若觸發)': 26521,
  莫非王土: 239,
  莫非王土II: 241,
  天賜收成: 222,
  天賜收成II: 224,
  納爾札爾福音: 21203,
  諾菲卡福音: 21204
};

export function getRotationActionIcon(actionName: string, gatherIconUrl: string): string {
  if (actionName.startsWith('採集')) return gatherIconUrl;
  const actionId = ACTION_IDS_BY_NAME[actionName];
  return actionId ? getActionIcon(actionId) : '';
}

export function getRotationActionName(
  actionName: string,
  gatherLabel: string,
  conditionalSuffix: string,
  conditionalGatherSuffix = conditionalSuffix
): string {
  if (actionName.startsWith('採集')) {
    return actionName.includes('理智觸發') ? `${gatherLabel}${conditionalGatherSuffix}` : gatherLabel;
  }

  const actionId = ACTION_IDS_BY_NAME[actionName];
  if (!actionId) return actionName;

  const name = getActionName(actionId);
  return actionName.includes('若觸發') ? `${name}${conditionalSuffix}` : name;
}
