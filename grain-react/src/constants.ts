import type { Workspace, Group, Tag, WorkspaceGroups, GroupTags } from './types';

// 默认工作空间
export const DEFAULT_WORKSPACES: Workspace[] = [
  { id: 'ws_main', name: '我的提示词库', desc: 'AI 绘画提示词管理主库，涵盖人物/产品/插画等分类。', color: '255', createdAt: '2026-01-15' },
  { id: 'ws_design', name: '品牌设计素材', desc: '品牌 VI 相关提示词，专人专用。', color: '170', createdAt: '2026-03-02' },
  { id: 'ws_team', name: '团队共享库', desc: '团队协作提示词池，所有人可编辑。', color: '145', createdAt: '2026-04-10' },
];

// 默认词组
export const DEFAULT_GROUPS: Group[] = [
  { id: 'people', name: '人物肖像', desc: '角色、构图、姿势相关提示词，用于人物生成。', color: '255' },
  { id: 'product', name: '产品摄影', desc: '产品展示、电商场景等提示词。', color: '170' },
  { id: 'illustration', name: '插画风格', desc: '水彩、扁平、像素、赛璐珞等插画风格提示词。', color: '145' },
  { id: 'architecture', name: '建筑空间', desc: '建筑、街道、风景等空间类提示词。', color: '45' },
  { id: 'concept', name: '概念艺术', desc: '科幻、赛博朋克、艺术风格提示词。', color: '28' },
  { id: 'anime', name: '动漫风格', desc: '日式动漫、二次元风格提示词。', color: '300' },
  { id: 'food', name: '美食摄影', desc: '美食拍摄、质感特写提示词。', color: '200' },
];

// 默认 Tags
export const DEFAULT_TAGS: Tag[] = [
  // 角色
  { id: 't01', en: '1girl', zh: '一个女孩', category: '角色' },
  { id: 't02', en: '1boy', zh: '一个男孩', category: '角色' },
  { id: 't03', en: '2girls', zh: '两个女孩', category: '角色' },
  { id: 't04', en: 'young_woman', zh: '年轻女性', category: '角色' },
  { id: 't05', en: 'mature_male', zh: '成熟男性', category: '角色' },
  // 画风
  { id: 't06', en: 'anime', zh: '动漫风格', category: '画风' },
  { id: 't07', en: 'realistic', zh: '写实风格', category: '画风' },
  { id: 't08', en: 'watercolor', zh: '水彩风格', category: '画风' },
  { id: 't09', en: 'oil_painting', zh: '油画风格', category: '画风' },
  { id: 't10', en: 'pixel_art', zh: '像素风格', category: '画风' },
  { id: 't11', en: 'flat_illustration', zh: '扁平插画', category: '画风' },
  { id: 't12', en: 'cel_shaded', zh: '赛璐珞风格', category: '画风' },
  // 构图
  { id: 't13', en: 'close_up', zh: '特写', category: '构图' },
  { id: 't14', en: 'full_body', zh: '全身', category: '构图' },
  { id: 't15', en: 'upper_body', zh: '半身', category: '构图' },
  { id: 't16', en: 'portrait', zh: '人像构图', category: '构图' },
  { id: 't17', en: 'wide_angle', zh: '广角', category: '构图' },
  // 光影
  { id: 't18', en: 'cinematic_lighting', zh: '电影布光', category: '光影' },
  { id: 't19', en: 'soft_lighting', zh: '柔光', category: '光影' },
  { id: 't20', en: 'dramatic_shadow', zh: '戏剧阴影', category: '光影' },
  { id: 't21', en: 'backlight', zh: '逆光', category: '光影' },
  { id: 't22', en: 'neon_light', zh: '霓虹光影', category: '光影' },
  // 画质
  { id: 't23', en: 'masterpiece', zh: '杰作', category: '画质' },
  { id: 't24', en: 'high_resolution', zh: '高分辨率', category: '画质' },
  { id: 't25', en: 'detailed_face', zh: '精细面部', category: '画质' },
  { id: 't26', en: 'best_quality', zh: '最佳质量', category: '画质' },
  // 场景
  { id: 't27', en: 'outdoor', zh: '户外', category: '场景' },
  { id: 't28', en: 'indoor', zh: '室内', category: '场景' },
  { id: 't29', en: 'city_street', zh: '城市街道', category: '场景' },
  { id: 't30', en: 'beach', zh: '海滩', category: '场景' },
  { id: 't31', en: 'snow_mountain', zh: '雪山', category: '场景' },
  { id: 't32', en: 'forest', zh: '森林', category: '场景' },
  // 色调
  { id: 't33', en: 'warm_tone', zh: '暖色调', category: '色调' },
  { id: 't34', en: 'cold_tone', zh: '冷色调', category: '色调' },
  { id: 't35', en: 'monochrome', zh: '黑白', category: '色调' },
  { id: 't36', en: 'pastel_colors', zh: '柔和色彩', category: '色调' },
];

// 默认工作空间-词组关联
export const DEFAULT_WORKSPACE_GROUPS: WorkspaceGroups = {
  ws_main: [
    { groupId: 'people', type: 'positive' },
    { groupId: 'product', type: 'positive' },
    { groupId: 'architecture', type: 'negative' },
    { groupId: 'illustration', type: 'positive' },
    { groupId: 'concept', type: 'positive' },
  ],
  ws_design: [
    { groupId: 'product', type: 'positive' },
    { groupId: 'anime', type: 'positive' },
    { groupId: 'food', type: 'positive' },
  ],
  ws_team: [
    { groupId: 'people', type: 'positive' },
    { groupId: 'concept', type: 'positive' },
    { groupId: 'anime', type: 'positive' },
    { groupId: 'food', type: 'positive' },
    { groupId: 'product', type: 'positive' },
    { groupId: 'illustration', type: 'positive' },
    { groupId: 'architecture', type: 'negative' },
  ],
};

// 默认词组-Tag关联
export const DEFAULT_GROUP_TAGS: GroupTags = {
  people: ['t01', 't02', 't03', 't04', 't05', 't13', 't14', 't15', 't16'],
  product: ['t06', 't07', 't09', 't11', 't17', 't27'],
  illustration: ['t08', 't10', 't11', 't12', 't09'],
  architecture: ['t17', 't27', 't28', 't29', 't31', 't32'],
  concept: ['t10', 't18', 't20', 't22', 't35'],
  anime: ['t03', 't04', 't06', 't12', 't08'],
  food: ['t13', 't19', 't23', 't24', 't27', 't28', 't33'],
};

// 主题色选项
export const COLOR_OPTIONS = ['255', '170', '145', '45', '28', '300', '200'];
