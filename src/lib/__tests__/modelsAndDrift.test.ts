import { describe, expect, it } from 'vitest';
import { getSeedDatabase } from '@/data/seed';

describe('Models Registry & Data Drift Logic', () => {
  it('loads all registered models with valid schema attributes', () => {
    const db = getSeedDatabase();
    expect(db.models.length).toBe(14);

    db.models.forEach((model) => {
      expect(model.id).toBeTruthy();
      expect(model.displayName).toBeTruthy();
      expect(model.endpoint.startsWith('/')).toBe(true);
      expect(model.slaLatencyMs).toBeGreaterThan(0);
      expect(model.versions.length).toBeGreaterThanOrEqual(1);
      expect(model.qualityScores.groundedness).toBeGreaterThan(80);
      expect(model.qualityScores.safetyRate).toBeGreaterThan(95);
    });
  });

  it('correctly filters models by category and health status', () => {
    const db = getSeedDatabase();

    const llms = db.models.filter((m) => m.category === 'LLM');
    expect(llms.length).toBeGreaterThan(0);
    expect(llms.every((m) => m.category === 'LLM')).toBe(true);

    const criticalModels = db.models.filter((m) => m.status === 'critical');
    expect(criticalModels.length).toBeGreaterThan(0);
    expect(criticalModels.every((m) => m.status === 'critical')).toBe(true);
  });

  it('provides 6 features for the Data Drift heatmap with 14 time windows each', () => {
    const db = getSeedDatabase();
    expect(db.driftFeatures.length).toBe(6);

    db.driftFeatures.forEach((feat) => {
      expect(feat.hourlyPsi).toHaveLength(14);
      expect(feat.baselineDistribution.length).toBe(10);
      expect(feat.productionDistribution.length).toBe(10);
      expect(feat.distributionBins.length).toBe(10);
      expect(feat.psiScore).toBeGreaterThan(0);
      expect(feat.ksStat).toBeGreaterThan(0);
    });

    const highDrift = db.driftFeatures.filter((f) => f.psiScore >= 0.25);
    expect(highDrift.length).toBeGreaterThanOrEqual(2);
  });
});
