import React from "react";
import "./ProgressBar.css";

const ProgressBar = ({ progress, label, showPercentage = true }) => {
  const percentage = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="progress-bar-container">
      {label && <div className="progress-label">{label}</div>}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {showPercentage && <div className="progress-text">{percentage}%</div>}
    </div>
  );
};

export default ProgressBar;
