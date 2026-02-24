'use client';

import { Prescription } from '@/lib/types';

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-400 border-green-500 bg-green-500/10',
  B: 'text-lime-400 border-lime-500 bg-lime-500/10',
  C: 'text-yellow-400 border-yellow-500 bg-yellow-500/10',
  D: 'text-orange-400 border-orange-500 bg-orange-500/10',
  F: 'text-red-400 border-red-500 bg-red-500/10',
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-green-500/20 text-green-300 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const RISK_COLORS: Record<string, string> = {
  low: 'text-green-400',
  moderate: 'text-yellow-400',
  high: 'text-orange-400',
  severe: 'text-red-400',
};

export default function PrescriptionReport({ prescription }: { prescription: Prescription }) {
  const gradeColor = GRADE_COLORS[prescription.overallHealthGrade] || GRADE_COLORS.C;

  return (
    <div className="space-y-6">
      {/* Header: Grade + Summary */}
      <div className="flex items-start gap-6">
        <div className={`flex-shrink-0 w-24 h-24 rounded-2xl border-2 flex items-center justify-center ${gradeColor}`}>
          <span className="text-5xl font-bold">{prescription.overallHealthGrade}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">Field Health Assessment</h3>
          <p className="text-gray-300">{prescription.summary}</p>
          <p className="text-sm text-gray-500 mt-1">
            Generated {new Date(prescription.generatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Issues Found */}
      {prescription.issues.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4">Issues Detected</h4>
          <div className="space-y-3">
            {prescription.issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-900/50 rounded-lg p-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${SEVERITY_COLORS[issue.severity]}`}>
                  {issue.severity.toUpperCase()}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white capitalize">
                      {issue.class.replace(/_/g, ' ')}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {issue.detectionCount} detection{issue.detectionCount !== 1 ? 's' : ''} · {(issue.avgConfidence * 100).toFixed(0)}% conf
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{issue.description}</p>
                  {issue.affectedAcres > 0 && (
                    <p className="text-gray-500 text-xs mt-1">~{issue.affectedAcres.toFixed(1)} acres affected</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {prescription.prescriptions.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4">Recommended Actions</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 pr-3">#</th>
                  <th className="text-left py-2 pr-3">Action</th>
                  <th className="text-left py-2 pr-3">Product</th>
                  <th className="text-left py-2 pr-3">Rate</th>
                  <th className="text-left py-2 pr-3">Timing</th>
                  <th className="text-right py-2">Cost/Acre</th>
                </tr>
              </thead>
              <tbody>
                {prescription.prescriptions
                  .sort((a, b) => a.priority - b.priority)
                  .map((rx, i) => (
                    <tr key={i} className="border-b border-gray-700/50 text-gray-300">
                      <td className="py-2 pr-3">
                        <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono">
                          P{rx.priority}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-medium text-white">{rx.action}</td>
                      <td className="py-2 pr-3">{rx.product}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{rx.rate}</td>
                      <td className="py-2 pr-3">{rx.timing}</td>
                      <td className="py-2 text-right font-mono">
                        ${rx.estimatedCostPerAcre.toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Yield Risk Assessment */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h4 className="text-lg font-semibold text-white mb-4">Yield Risk Assessment</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Risk Level</p>
            <p className={`text-lg font-bold capitalize ${RISK_COLORS[prescription.yieldImpact.riskLevel]}`}>
              {prescription.yieldImpact.riskLevel}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Est. Loss/Acre</p>
            <p className="text-lg font-bold text-white font-mono">
              ${prescription.yieldImpact.estimatedLossPerAcre.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Prevention Window</p>
            <p className="text-lg font-bold text-white">
              {prescription.yieldImpact.preventionWindow}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Total Est. Loss</p>
            <p className="text-lg font-bold text-red-400 font-mono">
              ${prescription.yieldImpact.totalEstimatedLoss.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Total Cost */}
      <div className="flex items-center justify-between bg-emerald-500/10 rounded-xl p-5 border border-emerald-500/30">
        <div>
          <p className="text-emerald-300 font-semibold">Total Estimated Treatment Cost</p>
          <p className="text-gray-400 text-sm">All recommended actions combined</p>
        </div>
        <p className="text-3xl font-bold text-emerald-300 font-mono">
          ${prescription.totalEstimatedCost.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
