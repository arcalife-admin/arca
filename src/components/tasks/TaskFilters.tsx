'use client';

import { useState } from 'react';
import { TaskStatus, TaskPriority, type TaskFilters, TaskSortOptions } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Filter,
  X,
  Calendar,
  Search,
  SortAsc,
  SortDesc
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface TaskFiltersProps {
  filters: TaskFilters;
  sortOptions: TaskSortOptions;
  onFiltersChange: (filters: TaskFilters) => void;
  onSortChange: (sortOptions: TaskSortOptions) => void;
  onClearFilters: () => void;
  patients?: Array<{ id: string; firstName: string; lastName: string }>;
}

export default function TaskFilters({
  filters,
  sortOptions,
  onFiltersChange,
  onSortChange,
  onClearFilters,
  patients = []
}: TaskFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusChange = (status: TaskStatus, checked: boolean) => {
    const newStatuses = checked
      ? [...(filters.status || []), status]
      : (filters.status || []).filter(s => s !== status);

    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined
    });
  };

  const handlePriorityChange = (priority: TaskPriority, checked: boolean) => {
    const newPriorities = checked
      ? [...(filters.priority || []), priority]
      : (filters.priority || []).filter(p => p !== priority);

    onFiltersChange({
      ...filters,
      priority: newPriorities.length > 0 ? newPriorities : undefined
    });
  };

  const handleDateRangeChange = (type: 'deadline' | 'createdAt', field: 'from' | 'to', value: string) => {
    const dateValue = value ? new Date(value) : undefined;

    onFiltersChange({
      ...filters,
      [type]: {
        ...filters[type],
        [field]: dateValue
      }
    });
  };

  const activeFiltersCount = [
    filters.status?.length,
    filters.priority?.length,
    filters.assignedToMe ? 1 : 0,
    filters.createdByMe ? 1 : 0,
    filters.patientId ? 1 : 0,
    filters.deadline?.from || filters.deadline?.to ? 1 : 0,
    filters.createdAt?.from || filters.createdAt?.to ? 1 : 0,
    filters.search ? 1 : 0
  ].filter(Boolean).length;

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </CollapsibleTrigger>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Select
                value={sortOptions.field}
                onValueChange={(value) => onSortChange({ ...sortOptions, field: value as any })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="updatedAt">Updated Date</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSortChange({
                  ...sortOptions,
                  direction: sortOptions.direction === 'asc' ? 'desc' : 'asc'
                })}
              >
                {sortOptions.direction === 'asc' ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Search */}
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search tasks..."
                  value={filters.search || ''}
                  onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Status Filter */}
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="space-y-2 mt-2">
                  {Object.values(TaskStatus).map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filters.status?.includes(status) || false}
                        onCheckedChange={(checked) => handleStatusChange(status, checked as boolean)}
                      />
                      <Label htmlFor={`status-${status}`} className="text-sm">
                        {status.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <Label className="text-sm font-medium">Priority</Label>
                <div className="space-y-2 mt-2">
                  {Object.values(TaskPriority).map((priority) => (
                    <div key={priority} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priority-${priority}`}
                        checked={filters.priority?.includes(priority) || false}
                        onCheckedChange={(checked) => handlePriorityChange(priority, checked as boolean)}
                      />
                      <Label htmlFor={`priority-${priority}`} className="text-sm">
                        {priority}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignment Filter */}
              <div>
                <Label className="text-sm font-medium">Assignment</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="assigned-to-me"
                      checked={filters.assignedToMe || false}
                      onCheckedChange={(checked) => onFiltersChange({
                        ...filters,
                        assignedToMe: checked as boolean || undefined
                      })}
                    />
                    <Label htmlFor="assigned-to-me" className="text-sm">
                      Assigned to me
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="created-by-me"
                      checked={filters.createdByMe || false}
                      onCheckedChange={(checked) => onFiltersChange({
                        ...filters,
                        createdByMe: checked as boolean || undefined
                      })}
                    />
                    <Label htmlFor="created-by-me" className="text-sm">
                      Created by me
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Filter */}
            {patients.length > 0 && (
              <div>
                <Label htmlFor="patient">Patient</Label>
                <Select
                  value={filters.patientId || 'all'}
                  onValueChange={(value) => onFiltersChange({
                    ...filters,
                    patientId: value === 'all' ? undefined : value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All patients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All patients</SelectItem>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Deadline
                </Label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Label htmlFor="deadline-from" className="text-xs">From</Label>
                    <Input
                      id="deadline-from"
                      type="date"
                      value={filters.deadline?.from ? new Date(filters.deadline.from).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleDateRangeChange('deadline', 'from', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deadline-to" className="text-xs">To</Label>
                    <Input
                      id="deadline-to"
                      type="date"
                      value={filters.deadline?.to ? new Date(filters.deadline.to).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleDateRangeChange('deadline', 'to', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Created Date
                </Label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Label htmlFor="created-from" className="text-xs">From</Label>
                    <Input
                      id="created-from"
                      type="date"
                      value={filters.createdAt?.from ? new Date(filters.createdAt.from).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleDateRangeChange('createdAt', 'from', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="created-to" className="text-xs">To</Label>
                    <Input
                      id="created-to"
                      type="date"
                      value={filters.createdAt?.to ? new Date(filters.createdAt.to).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleDateRangeChange('createdAt', 'to', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
} 