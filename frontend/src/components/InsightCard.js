function InsightCard({ title, value, description, variant = "default" }) {
  const className = `insight-card insight-card--${variant}`;

  return (
    <div className={className}>
      <h3 className="insight-card-title">{title}</h3>
      <p className="insight-card-value">{value}</p>
      <p className="insight-card-description">{description}</p>
    </div>
  );
}

export default InsightCard;
