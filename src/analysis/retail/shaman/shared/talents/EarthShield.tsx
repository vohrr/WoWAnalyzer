import { formatPercentage } from 'common/format';
import SPELLS from 'common/SPELLS';
import { TALENTS_SHAMAN } from 'common/TALENTS';
import { SpellLink } from 'interface';
import Analyzer, { Options, SELECTED_PLAYER } from 'parser/core/Analyzer';
import { calculateEffectiveHealing } from 'parser/core/EventCalculateLib';
import Events, { HealEvent } from 'parser/core/Events';
import { ThresholdStyle } from 'parser/core/ParseResults';
import Combatants from 'parser/shared/modules/Combatants';
import STATISTIC_CATEGORY from 'parser/ui/STATISTIC_CATEGORY';
import StatisticListBoxItem from 'parser/ui/StatisticListBoxItem';
import ElementalOrbit from './ElementalOrbit';
import { RoundedPanel } from 'interface/guide/components/GuideDivs';
import { explanationAndDataSubsection } from 'interface/guide/components/ExplanationRow';
import { GUIDE_CORE_EXPLANATION_PERCENT } from '../../restoration/Guide';
import uptimeBarSubStatistic from 'parser/ui/UptimeBarSubStatistic';
import { Uptime } from 'parser/ui/UptimeBar';
import { RESTORATION_COLORS } from '../../restoration/constants';

export const EARTHSHIELD_HEALING_INCREASE = 0.2;

class EarthShield extends Analyzer {
  static dependencies = {
    combatants: Combatants,
    elementalOrbit: ElementalOrbit,
  };

  protected combatants!: Combatants;
  protected elementalOrbit!: ElementalOrbit;

  healing = 0;
  buffHealing = 0;
  earthShieldHealingIncrease = EARTHSHIELD_HEALING_INCREASE;
  category = STATISTIC_CATEGORY.TALENTS;

  constructor(options: Options) {
    super(options);
    this.active = this.selectedCombatant.hasTalent(TALENTS_SHAMAN.EARTH_SHIELD_TALENT);

    if (!this.active) {
      return;
    }

    // event listener for direct heals when taking damage with earth shield
    this.addEventListener(
      Events.heal.by(SELECTED_PLAYER).spell(SPELLS.EARTH_SHIELD_HEAL),
      this.onEarthShieldHeal,
    );

    // As of 2/23/2023 - all spells affected. Implement this constant if new spells are found to not be
    // const HEALING_ABILITIES_AMPED_BY_EARTH_SHIELD_FILTERED = HEALING_ABILITIES_AMPED_BY_EARTH_SHIELD.filter(
    //   (p) => p !== SPELLS.EARTH_SHIELD_HEAL,);

    // event listener for healing being buffed by having earth shield on the target
    this.addEventListener(Events.heal.by(SELECTED_PLAYER), this.onEarthShieldAmpSpellHeal);
  }

  get totalHealing() {
    return (
      (this.elementalOrbit.active
        ? this.elementalOrbit.healing + this.elementalOrbit.buffHealing
        : 0) +
      this.buffHealing +
      this.healing
    );
  }

  get uptime() {
    return Object.values(this.combatants.players).reduce(
      (uptime, player) =>
        uptime + player.getBuffUptime(TALENTS_SHAMAN.EARTH_SHIELD_TALENT.id, this.owner.playerId),
      0,
    );
  }

  get uptimePercent() {
    return this.uptime / this.owner.fightDuration;
  }

  get suggestionThresholds() {
    return {
      actual: this.uptimePercent,
      isLessThan: {
        minor: 0.95,
        average: 0.9,
        major: 0.8,
      },
      style: ThresholdStyle.PERCENTAGE,
    };
  }

  onEarthShieldHeal(event: HealEvent) {
    const combatant = this.combatants.getEntity(event);
    if (combatant && combatant.hasBuff(TALENTS_SHAMAN.EARTH_SHIELD_TALENT.id, event.timestamp)) {
      this.healing += event.amount + (event.absorbed || 0);
    }
  }

  onEarthShieldAmpSpellHeal(event: HealEvent) {
    const combatant = this.combatants.getEntity(event);
    if (combatant && combatant.hasBuff(TALENTS_SHAMAN.EARTH_SHIELD_TALENT.id, event.timestamp)) {
      this.buffHealing += calculateEffectiveHealing(event, this.earthShieldHealingIncrease);
    }
  }

  subStatistic() {
    return (
      <StatisticListBoxItem
        title={<SpellLink id={TALENTS_SHAMAN.EARTH_SHIELD_TALENT.id} />}
        value={`${formatPercentage(
          this.owner.getPercentageOfTotalHealingDone(this.totalHealing),
        )} %`}
      />
    );
  }

  /** Guide subsection describing the proper usage of Earth Shield */
  get guideSubsection(): JSX.Element {
    const hasElementalOrbit = this.elementalOrbit.active;
    const hasEarthenHarmony = this.selectedCombatant.hasTalent(
      TALENTS_SHAMAN.EARTHEN_HARMONY_TALENT,
    );

    const explanation = (
      <>
        <b>
          <SpellLink id={TALENTS_SHAMAN.EARTH_SHIELD_TALENT.id} />
        </b>{' '}
        is the only shield shaman has that can be placed on allies and provides very strong
        throughput when combined with affecting talents in the class and spec tree.{' '}
        <SpellLink id={TALENTS_SHAMAN.EARTH_SHIELD_TALENT.id} /> should be applied prior to the
        fight starting and maintained as it falls off throughout the encounter
        <br />
        {hasElementalOrbit && (
          <>
            <b>
              <SpellLink id={TALENTS_SHAMAN.ELEMENTAL_ORBIT_TALENT.id} />
            </b>{' '}
            allows you to place <SpellLink id={TALENTS_SHAMAN.EARTH_SHIELD_TALENT.id} /> on yourself
            as well as an ally, and you should aim to maintain high uptime on both
            <br />
          </>
        )}
        {hasEarthenHarmony && (
          <>
            <b>
              <SpellLink id={TALENTS_SHAMAN.EARTHEN_HARMONY_TALENT.id} />
            </b>{' '}
            augments <SpellLink id={TALENTS_SHAMAN.EARTH_SHIELD_TALENT.id} /> even further by
            providing damage reduction (TODO METRIC HERE FOR DAMAGE REDUCED)
            <br />
          </>
        )}
      </>
    );

    const data = (
      <div>
        <RoundedPanel>
          <strong>
            <SpellLink spell={TALENTS_SHAMAN.EARTH_SHIELD_TALENT} /> Uptimes
          </strong>
          {this.earthShieldUptimeBar()}
          {hasElementalOrbit && this.elementalOrbitUptimeBar()}
        </RoundedPanel>
      </div>
    );

    return explanationAndDataSubsection(explanation, data, GUIDE_CORE_EXPLANATION_PERCENT);
  }

  getUptimeHistory(spellId: number) {
    const uptimeHistory: Uptime[] = [];
    let current: Uptime;
    Object.values(this.combatants.players).forEach((player) => {
      player.getBuffHistory(spellId, this.owner.playerId).forEach((trackedBuff) => {
        console.log(trackedBuff);
        current = { start: trackedBuff.start, end: trackedBuff.end! };
        uptimeHistory.push(current);
      });
    });
    return uptimeHistory;
  }

  earthShieldUptimeBar() {
    return uptimeBarSubStatistic(this.owner.fight, {
      spells: [TALENTS_SHAMAN.EARTH_SHIELD_TALENT],
      uptimes: this.getUptimeHistory(TALENTS_SHAMAN.EARTH_SHIELD_TALENT.id),
      color: RESTORATION_COLORS.CHAIN_HEAL,
    });
  }
  elementalOrbitUptimeBar() {
    return uptimeBarSubStatistic(this.owner.fight, {
      spells: [TALENTS_SHAMAN.ELEMENTAL_ORBIT_TALENT],
      uptimes: this.getUptimeHistory(SPELLS.EARTH_SHIELD_ELEMENTAL_ORBIT_BUFF.id),
      color: RESTORATION_COLORS.HEALING_RAIN,
    });
  }
}

export default EarthShield;
