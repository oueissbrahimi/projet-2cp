import React from 'react';
import Card from './UI/Card';
import Button from './UI/Button';
import './FleetUtilizationWidget.css';

/**
 * FleetUtilizationWidget
 * Designed using impeccable craft. Follows "The Industrial Grid" 
 * with flat layouts, data-heavy focus, and functional execution.
 */
const FleetUtilizationWidget = ({ activeVehicles = 0, totalVehicles = 0, onManageFleet }) => {
  const utilizationPercentage = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;
  
  // Status check to drive structural color rules
  const isHealthy = utilizationPercentage > 50;

  return (
    <Card variant="container" className="fleet-widget">
      <div className="fleet-widget-header">
        <h3 className="fleet-title">Fleet Utilization</h3>
        <span className="fleet-badge">{utilizationPercentage}% Active</span>
      </div>

      <div className="fleet-metrics-grid">
        <div className="fleet-metric">
          <span className="metric-label">On Route</span>
          <span className="metric-value" style={{ color: isHealthy ? 'var(--app-green)' : 'inherit' }}>
            {activeVehicles}
          </span>
        </div>
        <div className="fleet-metric">
          <span className="metric-label">Total Fleet</span>
          <span className="metric-value">{totalVehicles}</span>
        </div>
        <div className="fleet-metric">
          <span className="metric-label">Idle</span>
          <span className="metric-value">{totalVehicles - activeVehicles}</span>
        </div>
      </div>

      <div className="fleet-progress-track">
        <div 
          className="fleet-progress-fill" 
          style={{ width: `${utilizationPercentage}%`, backgroundColor: isHealthy ? 'var(--app-green)' : '#f59e0b' }} 
        />
      </div>

      <div className="fleet-widget-footer">
        <p className="fleet-note">Tracking based on real-time ELD telemetry.</p>
        <Button variant="ghost" onClick={onManageFleet}>Manage Fleet</Button>
      </div>
    </Card>
  );
};

export default FleetUtilizationWidget;
