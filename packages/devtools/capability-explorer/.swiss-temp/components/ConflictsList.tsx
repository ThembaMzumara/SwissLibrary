/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/** @jsxImportSource @swissjs/core */
/// <reference types="@swissjs/core" />
import { SwissComponent } from '@swissjs/core';
import type { CapabilityConflict } from '../services/DataService.js';

interface ConflictsListProps {
  conflicts: CapabilityConflict[];
  onConflictSelect: (conflict: CapabilityConflict) => void;
}

export default class ConflictsList extends SwissComponent<ConflictsListProps> {
  constructor(props: ConflictsListProps) {
    super(props);
  }

  render() {
    return (
      <div className="conflicts-list">
        {this.props.conflicts.length === 0 ? (
          <div className="no-conflicts">
            <div className="success-icon">✅</div>
            <div className="message">No capability conflicts detected</div>
          </div>
        ) : (
          <div className="conflict-items">
            {this.props.conflicts.map(conflict => (
              <div 
                key={`${conflict.componentId}-${conflict.capability}`}
                className="conflict-item"
                onClick={() => this.props.onConflictSelect(conflict)}
              >
                <div className="conflict-header">
                  <span className="component-name">{conflict.componentName}</span>
                  <span className="capability-name">{conflict.capability}</span>
                </div>
                <div className="conflict-details">
                  <span className="reason">{conflict.reason}</span>
                  <span className="component-id">#{conflict.componentId.slice(-8)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  private getStyles(): string {
    return html`
      <style>
        .conflicts-list {
          font-size: 0.9rem;
        }

        .no-conflicts {
          text-align: center;
          padding: 2rem;
          color: #28a745;
          font-size: 1.1rem;
        }

        .no-conflicts-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .no-conflicts-text {
          font-weight: 500;
        }

        .conflicts-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .conflict-item {
          padding: 0.75rem;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
          border-left: 4px solid #ffc107;
        }

        .conflict-item.severe {
          background: #ffecb3;
        }

        .conflict-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .conflict-capability {
          font-weight: 500;
          color: #856404;
        }

        .conflict-severity {
          font-family: monospace;
          font-size: 0.8rem;
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          background: #ffc107;
          color: #212529;
        }

        .conflict-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .conflict-reason {
          color: #856404;
          font-size: 0.9rem;
        }

        .conflict-nodes {
          font-family: monospace;
          font-size: 0.8rem;
          color: #6c757d;
        }
      </style>
    `;
  }
}
