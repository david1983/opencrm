export function Badge({ children, variant = 'default', size = 'md' }) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
}

// Lead status badge
export function LeadStatusBadge({ status }) {
  const variants = {
    'New': 'info',
    'Contacted': 'warning',
    'Qualified': 'success',
    'Unqualified': 'danger',
    'Converted': 'success',
  };

  return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
}

// Opportunity stage badge
export function StageBadge({ stage }) {
  const variants = {
    'Prospecting': 'default',
    'Qualification': 'info',
    'Proposal': 'warning',
    'Negotiation': 'primary',
    'Closed Won': 'success',
    'Closed Lost': 'danger',
  };

  return <Badge variant={variants[stage] || 'default'}>{stage}</Badge>;
}

// Task priority badge
export function PriorityBadge({ priority }) {
  const variants = {
    'High': 'danger',
    'Normal': 'primary',
    'Low': 'default',
  };

  return <Badge variant={variants[priority] || 'default'}>{priority}</Badge>;
}

// Task status badge
export function TaskStatusBadge({ status }) {
  const variants = {
    'Not Started': 'default',
    'In Progress': 'warning',
    'Completed': 'success',
    'Deferred': 'info',
  };

  return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
}