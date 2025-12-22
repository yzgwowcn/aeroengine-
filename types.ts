export interface EngineInputs {
  // 飞行条件
  altitude: number; // 高度 (km)
  mach: number;     // 马赫数
  massFlow: number; // 设计点总空气流量 (kg/s)

  // 核心循环设计参数
  bypassRatio: number;          // 涵道比 (B)
  overallPressureRatio: number; // 总压比 (OPR, pi_c)
  fanPressureRatio: number;     // 风扇压比 (FPR, pi_f)
  turbineEntryTemp: number;     // 涡轮前温度/燃烧室出口温度 (Tt4, K)

  // 部件效率与损失系数 (绝热效率/总压恢复)
  efficiencyFan: number;        // 风扇绝热效率 (eta_f)
  efficiencyLPC: number;        // 低压压气机绝热效率 (eta_lpc - 简化模型中通常合并考虑)
  efficiencyHPC: number;        // 高压压气机绝热效率 (eta_hpc)
  efficiencyHPT: number;        // 高压涡轮绝热效率 (eta_hpt)
  efficiencyLPT: number;        // 低压涡轮绝热效率 (eta_lpt)
  efficiencyBurner: number;     // 燃烧效率 (eta_b)
  
  pressureRecoveryInlet: number;  // 进气道总压恢复系数 (sigma_i)
  pressureRecoveryBurner: number; // 燃烧室总压恢复系数 (sigma_b)
  pressureRecoveryNozzle: number; // 喷管总压恢复系数 (sigma_n)
  
  mechEfficiencyHigh: number;   // 高压轴机械效率 (eta_mH)
  mechEfficiencyLow: number;    // 低压轴机械效率 (eta_mL)

  // 燃料参数
  heatingValue: number; // 燃料热值 (Hu, MJ/kg)
}

export interface StationResult {
  name: string;   // 截面中文名称
  label: string;  // 截面编号 (如 "0", "2", "3")
  temp: number;   // 温度 (K)
  pressure: number; // 压力 (Pa)
  isTotal: boolean; // 是否为总参数 (Total vs Static)
}

export interface PerformanceResult {
  thrust: number;           // 总净推力 (N)
  specificThrust: number;   // 单位推力 (N / (kg/s))
  sfc: number;              // 耗油率 (kg/(N*h))
  massFlowRateAir: number;  // 物理空气流量
  fuelAirRatio: number;     // 油气比 (f)
  bypassVelocity: number;   // 外涵道排气速度 (m/s)
  coreVelocity: number;     // 内涵道排气速度 (m/s)
  thermalEfficiency: number;    // 热效率
  propulsiveEfficiency: number; // 推进效率
  overallEfficiency: number;    // 总效率
  fanPressureRatio: number; // 风扇压比 (UI透传)
  hpcPressureRatio: number; // 高压压气机压比 (计算值)
  isValid: boolean;         // 循环是否物理可行
}

export interface CalculationResult {
  stations: StationResult[];
  performance: PerformanceResult;
}

export interface ChartPoint {
  opr: number; // 总压比 (X轴)
  sfc: number; // 耗油率
  specificThrust: number; // 单位推力
}

export interface EnvelopePoint {
  mach: number;     // 马赫数
  altitude: number; // 高度
  sfc: number;      // 耗油率 (用于热力图着色)
  thrust: number;   // 推力
  isValid: boolean;
}