import { EngineInputs, CalculationResult, StationResult, ChartPoint, EnvelopePoint, FanTrendPoint, BypassTrendPoint } from '../types';

// 物理常数
const R_GAS = 287.05; // 气体常数 J/(kg*K)
const G = 9.80665;    // 重力加速度 m/s^2

/**
 * 标准大气模型 (ISA 1976 简化版)
 * @param altitudeKm 几何高度 (km)
 * @returns { T0, P0 } 环境静温(K) 和 环境静压(Pa)
 */
function getAtmosphere(altitudeKm: number) {
  const H = altitudeKm * 1000;
  let T0 = 0;
  let P0 = 0;

  // 对流层 (Troposphere) < 11km
  if (H <= 11000) {
    T0 = 288.15 - 0.0065 * H;
    P0 = 101325 * Math.pow(1 - 0.0065 * H / 288.15, 5.25588);
  } else {
    // 平流层 (Stratosphere) > 11km (简化处理，暂不考虑更高层的大气变化)
    const T11 = 216.65;
    const P11 = 22632.1;
    T0 = T11;
    P0 = P11 * Math.exp(-G * (H - 11000) / (R_GAS * T11));
  }
  return { T0, P0 };
}

// 气体热力学属性 (基于经典教材 Mattingly/Farokhi 的分段常数模型)
// 冷端 (进气道、压气机、风扇)
const PROP_COLD = { cp: 1005, k: 1.4 };
// 热端 (燃烧室、涡轮、喷管) - 取燃气平均值
const PROP_HOT = { cp: 1150, k: 1.33 }; 

/**
 * 计算等熵过程后的温度
 */
const isentropicT = (T_in: number, pi: number, k: number, eta: number, isCompressor: boolean) => {
  const k_minus_1_over_k = (k - 1) / k;
  if (isCompressor) {
    // 压气机: 实际温升 > 等熵温升
    return T_in * (1 + (Math.pow(pi, k_minus_1_over_k) - 1) / eta);
  } else {
    // 涡轮: 实际温降 < 等熵温降
    if (pi <= 0) return T_in; 
    return T_in * (1 - (1 - Math.pow(1 / pi, k_minus_1_over_k)) * eta);
  }
};

// 获取指数形式 gamma / (gamma - 1)
const getGammaExp = (k: number) => k / (k - 1);

/**
 * 辅助函数：计算进气道滞止参数
 * 用于流量修正计算
 */
function getInletConditions(altitude: number, mach: number, recovery: number) {
  const { T0, P0 } = getAtmosphere(altitude);
  const tau_r = 1 + (PROP_COLD.k - 1) / 2 * mach * mach;
  const pi_r = Math.pow(tau_r, getGammaExp(PROP_COLD.k));
  
  const Tt2 = T0 * tau_r;
  const Pt2 = P0 * pi_r * recovery;
  return { Tt2, Pt2 };
}

/**
 * 核心计算函数：分排气涡扇发动机热力循环
 */
export const calculateCycle = (inputs: EngineInputs): CalculationResult => {
  const {
    altitude, mach, massFlow, bypassRatio, overallPressureRatio, fanPressureRatio, turbineEntryTemp,
    efficiencyFan, efficiencyHPC, efficiencyHPT, efficiencyLPT, efficiencyBurner,
    pressureRecoveryInlet, pressureRecoveryBurner, pressureRecoveryNozzle,
    mechEfficiencyHigh, mechEfficiencyLow, heatingValue
  } = inputs;

  // 1. 获取环境参数 (截面 0)
  const { T0, P0 } = getAtmosphere(altitude);
  const V0 = mach * Math.sqrt(PROP_COLD.k * R_GAS * T0); // 飞行速度
  
  // 2. 进气道 (截面 0 -> 2)
  const tau_r = 1 + (PROP_COLD.k - 1) / 2 * mach * mach;
  const pi_r = Math.pow(tau_r, getGammaExp(PROP_COLD.k));
  
  const Tt0 = T0 * tau_r; // 滞止温度
  const Pt0 = P0 * pi_r;  // 滞止压力
  
  const Tt2 = Tt0; // 绝热
  const Pt2 = Pt0 * pressureRecoveryInlet; // 考虑进气道总压恢复

  // 3. 风扇 (截面 2 -> 13 外涵 / 21 内涵)
  const Pt13 = Pt2 * fanPressureRatio;
  const Tt13 = isentropicT(Tt2, fanPressureRatio, PROP_COLD.k, efficiencyFan, true);
  
  const Pt21 = Pt13; // 假设风扇后分流
  const Tt21 = Tt13;

  // 4. 高压压气机 HPC (截面 2.5/21 -> 3)
  const pi_ch = Math.max(1.1, overallPressureRatio / fanPressureRatio); 

  const Pt3 = Pt21 * pi_ch;
  const Tt3 = isentropicT(Tt21, pi_ch, PROP_COLD.k, efficiencyHPC, true);

  // 5. 燃烧室 (截面 3 -> 4)
  const Pt4 = Pt3 * pressureRecoveryBurner;
  const Tt4 = turbineEntryTemp; // TIT
  
  // 能量平衡计算油气比 f
  const Hu_J = heatingValue * 1e6; // MJ -> J
  const numerator = PROP_HOT.cp * Tt4 - PROP_COLD.cp * Tt3;
  const denominator = efficiencyBurner * Hu_J - PROP_HOT.cp * Tt4;
  const f = Math.max(0, numerator / denominator);

  // 6. 高压涡轮 HPT (截面 4 -> 4.5)
  const work_req_HPC = PROP_COLD.cp * (Tt3 - Tt21);
  const work_avail_HPT = work_req_HPC / mechEfficiencyHigh; 
  
  const deltaT_HPT = work_avail_HPT / ((1 + f) * PROP_HOT.cp);
  const Tt45 = Tt4 - deltaT_HPT;
  
  let Pt45 = Pt4; 
  let isValid = true;

  if (Tt45 < Tt3) isValid = false;

  const temp_ratio_HPT = Tt45 / Tt4;
  if (temp_ratio_HPT <= 0 || temp_ratio_HPT >= 1) {
      isValid = false;
  } else {
      const pressure_term_HPT = (1 - temp_ratio_HPT) / efficiencyHPT;
      if (pressure_term_HPT >= 1) isValid = false;
      else {
        const pi_HPT = Math.pow(1 / (1 - pressure_term_HPT), getGammaExp(PROP_HOT.k));
        Pt45 = Pt4 / pi_HPT;
      }
  }

  // 7. 低压涡轮 LPT (截面 4.5 -> 5)
  // 驱动风扇
  const work_req_Fan = (1 + bypassRatio) * PROP_COLD.cp * (Tt13 - Tt2);
  const work_extraction_LPT = work_req_Fan / mechEfficiencyLow;
  
  const deltaT_LPT = work_extraction_LPT / ((1 + f) * PROP_HOT.cp);
  const Tt5 = Tt45 - deltaT_LPT;

  let Pt5 = Pt45; 

  if (Tt5 < T0) isValid = false;

  const temp_ratio_LPT = Tt5 / Tt45;
  if (temp_ratio_LPT <= 0 || temp_ratio_LPT >= 1) {
      isValid = false;
  } else {
      const pressure_term_LPT = (1 - temp_ratio_LPT) / efficiencyLPT;
      if (pressure_term_LPT >= 1) isValid = false;
      else {
        const pi_LPT = Math.pow(1 / (1 - pressure_term_LPT), getGammaExp(PROP_HOT.k));
        Pt5 = Pt45 / pi_LPT;
      }
  }

  // 8. 喷管膨胀
  // 核心喷管 (9)
  const Pt9 = Pt5 * pressureRecoveryNozzle;
  let P9 = P0;
  let T9 = Tt5;
  let V9 = 0;

  if (isValid) {
      const critical_ratio_hot = Math.pow((PROP_HOT.k + 1) / 2, getGammaExp(PROP_HOT.k));
      if (Pt9 / P0 > critical_ratio_hot) {
        P9 = Pt9 / critical_ratio_hot;
        T9 = Tt5 * (2 / (PROP_HOT.k + 1));
        V9 = Math.sqrt(PROP_HOT.k * R_GAS * T9);
      } else {
        P9 = P0;
        if (Pt9 > P0) {
            T9 = Tt5 * Math.pow(P0 / Pt9, (PROP_HOT.k - 1) / PROP_HOT.k);
            V9 = Math.sqrt(Math.max(0, 2 * PROP_HOT.cp * (Tt5 - T9)));
        } else {
            isValid = false;
        }
      }
  }

  // 外涵喷管 (19)
  const Pt19 = Pt13 * pressureRecoveryNozzle;
  let P19 = P0;
  let T19 = Tt13;
  let V19 = 0;

  if (isValid) {
      const critical_ratio_cold = Math.pow((PROP_COLD.k + 1) / 2, getGammaExp(PROP_COLD.k));
      if (Pt19 / P0 > critical_ratio_cold) {
         P19 = Pt19 / critical_ratio_cold;
         T19 = Tt13 * (2 / (PROP_COLD.k + 1));
         V19 = Math.sqrt(PROP_COLD.k * R_GAS * T19);
      } else {
         P19 = P0;
         if (Pt19 > P0) {
             T19 = Tt13 * Math.pow(P0 / Pt19, (PROP_COLD.k - 1) / PROP_COLD.k);
             V19 = Math.sqrt(Math.max(0, 2 * PROP_COLD.cp * (Tt13 - T19)));
         }
      }
  }

  // 9. 性能汇总
  let specific_thrust = 0;
  let total_thrust = 0;
  let sfc = 0;
  let thermalEfficiency = 0;
  let propulsiveEfficiency = 0;
  let overallEfficiency = 0;

  if (isValid) {
      // 核心流推力
      const rho9 = P9 / (R_GAS * T9);
      const A9_per_unit = (1+f) / (rho9 * V9);
      const F_core = (1 + f) * V9 - 1 * V0 + (P9 - P0) * A9_per_unit;

      // 外涵推力
      const rho19 = P19 / (R_GAS * T19);
      const A19_per_unit = bypassRatio / (rho19 * V19);
      const F_bypass = bypassRatio * V19 - bypassRatio * V0 + (P19 - P0) * A19_per_unit;

      // 单位推力 Fs (N / kg/s airflow)
      specific_thrust = (F_core + F_bypass) / (1 + bypassRatio);
      
      // 总推力 Fn (N)
      total_thrust = specific_thrust * massFlow; 

      // 耗油率 SFC (kg/N/h)
      if (total_thrust > 0) {
         const m_fuel = f * (massFlow / (1 + bypassRatio));
         sfc = (m_fuel * 3600) / total_thrust; 
      }

      // 效率计算
      // 修正: 当喷管不完全膨胀(Choked, P9>P0)时，推力项包含压力项，动能计算需使用"有效排气速度"
      // V_eff = V + (P - P0) / (rho * V)
      // 否则分母(动能变化)会小于分子(推力做功)，导致推进效率 > 100%
      
      let V9_eff = V9;
      if (V9 > 1 && rho9 > 0) {
          V9_eff = V9 + (P9 - P0) / (rho9 * V9);
      }

      let V19_eff = V19;
      if (V19 > 1 && rho19 > 0) {
          V19_eff = V19 + (P19 - P0) / (rho19 * V19);
      }

      const m_core_abs = massFlow / (1 + bypassRatio);
      
      // 使用有效速度计算输出动能
      const KE_out_eff = 0.5 * m_core_abs * (1+f) * V9_eff**2 + 0.5 * (massFlow - m_core_abs) * V19_eff**2;
      const KE_in = 0.5 * massFlow * V0**2;
      
      // 输入燃料能量
      const Q_in = m_core_abs * f * Hu_J;

      if (Q_in > 0) {
        thermalEfficiency = (KE_out_eff - KE_in) / Q_in;
        if (KE_out_eff - KE_in > 0) {
             propulsiveEfficiency = (total_thrust * V0) / (KE_out_eff - KE_in);
        }
      }
      overallEfficiency = thermalEfficiency * propulsiveEfficiency;
  }

  // 清洗数据
  if (isNaN(specific_thrust) || !isFinite(specific_thrust)) specific_thrust = 0;
  if (isNaN(total_thrust) || !isFinite(total_thrust)) total_thrust = 0;
  if (isNaN(sfc) || !isFinite(sfc)) sfc = 0;
  if (propulsiveEfficiency > 1.0) propulsiveEfficiency = 0.999; // 最终安全钳位

  return {
    stations: [
      { name: "环境 (Ambient)", label: "0", temp: T0, pressure: P0, isTotal: false },
      { name: "进气道出口 (Inlet)", label: "2", temp: Tt2, pressure: Pt2, isTotal: true },
      { name: "风扇出口 (Fan)", label: "2.5", temp: Tt13, pressure: Pt13, isTotal: true },
      { name: "高压压气机出口 (HPC)", label: "3", temp: Tt3, pressure: Pt3, isTotal: true },
      { name: "燃烧室出口 (Burner)", label: "4", temp: Tt4, pressure: Pt4, isTotal: true },
      { name: "高压涡轮出口 (HPT)", label: "4.5", temp: Tt45, pressure: Pt45, isTotal: true },
      { name: "低压涡轮出口 (LPT)", label: "5", temp: Tt5, pressure: Pt5, isTotal: true },
      { name: "核心喷管 (Core Nozzle)", label: "9", temp: T9, pressure: P9, isTotal: false },
      { name: "外涵喷管 (Bypass Nozzle)", label: "19", temp: T19, pressure: P19, isTotal: false },
    ],
    performance: {
      thrust: total_thrust,
      specificThrust: specific_thrust,
      sfc: sfc,
      massFlowRateAir: massFlow,
      fuelAirRatio: f,
      bypassVelocity: V19,
      coreVelocity: V9,
      thermalEfficiency,
      propulsiveEfficiency,
      overallEfficiency,
      fanPressureRatio,
      hpcPressureRatio: pi_ch,
      isValid
    }
  };
};

export const calculateTrends = (baseInputs: EngineInputs): ChartPoint[] => {
  const points: ChartPoint[] = [];
  for (let opr = 10; opr <= 60; opr += 1.0) {
    if (opr <= baseInputs.fanPressureRatio) continue;
    
    // 趋势分析假设物理流量不变，主要看参数比值变化
    const res = calculateCycle({ ...baseInputs, overallPressureRatio: opr });
    if (res.performance.isValid && res.performance.specificThrust > 0) {
        points.push({
        opr: opr,
        sfc: res.performance.sfc,
        specificThrust: res.performance.specificThrust
        });
    }
  }
  return points;
};

/**
 * 计算风扇压比变化趋势
 */
export const calculateFanTrends = (baseInputs: EngineInputs): FanTrendPoint[] => {
    const points: FanTrendPoint[] = [];
    // 风扇压比范围 1.1 到 4.0
    for (let fpr = 1.1; fpr <= 4.0; fpr += 0.1) {
        // 确保 FPR < OPR
        if (fpr >= baseInputs.overallPressureRatio) continue;

        const res = calculateCycle({ ...baseInputs, fanPressureRatio: fpr });
        if (res.performance.isValid && res.performance.specificThrust > 0) {
            points.push({
                fpr: fpr,
                sfc: res.performance.sfc,
                specificThrust: res.performance.specificThrust
            });
        }
    }
    return points;
};

/**
 * 计算涵道比变化趋势
 */
export const calculateBypassTrends = (baseInputs: EngineInputs): BypassTrendPoint[] => {
    const points: BypassTrendPoint[] = [];
    // 涵道比范围 0.2 到 15
    for (let bpr = 0.2; bpr <= 15.0; bpr += 0.1) {
        const res = calculateCycle({ ...baseInputs, bypassRatio: bpr });
        if (res.performance.isValid && res.performance.specificThrust > 0) {
            points.push({
                bpr: bpr,
                sfc: res.performance.sfc,
                specificThrust: res.performance.specificThrust
            });
        }
    }
    return points;
};

/**
 * 飞行包线计算
 * 
 * 修正说明:
 * 发动机并不是在所有高度都吸入相同的物理流量。
 * 假设输入的 massFlow 是海平面静态 (SLS) 下的修正流量。
 * 在高空高速时，物理流量 m_dot = m_corr * (delta / sqrt(theta))
 * 计算出的总推力 (Thrust) 才具有真实的物理量级意义。
 * SFC 是比值参数，对流量修正不敏感，但推力绝对值对此非常敏感。
 */
export const calculateEnvelope = (baseInputs: EngineInputs): EnvelopePoint[] => {
    const data: EnvelopePoint[] = [];
    const machSteps = 50;
    const altSteps = 40;
    const maxMach = 2.5; 
    const maxAlt = 20;   // km

    // 计算参考点(SLS)的修正参数
    // Standard Day: T=288.15K, P=101325Pa
    // 假设输入流量即为设计点修正流量
    const designCorrectedFlow = baseInputs.massFlow; 

    for (let i = 0; i <= machSteps; i++) {
        const m = (i / machSteps) * maxMach;
        for (let j = 0; j <= altSteps; j++) {
            const h = (j / altSteps) * maxAlt;
            
            // 1. 计算当前飞行条件的进气道滞止参数
            const { Tt2, Pt2 } = getInletConditions(h, m, baseInputs.pressureRecoveryInlet);
            
            // 2. 计算修正因子
            const theta = Tt2 / 288.15;
            const delta = Pt2 / 101325;
            
            // 3. 计算该工况下的物理流量 (假设发动机在最大转速工作，修正流量近似恒定)
            // m_phys = m_corr * delta / sqrt(theta)
            const physicalMassFlow = designCorrectedFlow * (delta / Math.sqrt(theta));

            const inputs = { ...baseInputs, altitude: h, mach: m, massFlow: physicalMassFlow };
            const res = calculateCycle(inputs);
            
            if (res.performance.isValid && res.performance.thrust > 0) {
                data.push({
                    mach: m,
                    altitude: h,
                    sfc: res.performance.sfc,
                    thrust: res.performance.thrust,
                    isValid: true
                });
            }
        }
    }
    return data;
};
