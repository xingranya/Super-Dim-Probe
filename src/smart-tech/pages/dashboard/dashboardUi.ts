export const dashboardShellClass = (isFullscreen: boolean) =>
  [
    'grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6',
    isFullscreen
      ? 'fixed inset-0 z-50 overflow-y-auto bg-slate-50 p-4 md:p-6'
      : 'min-h-[calc(100vh-10rem)]',
  ].join(' ');

export const dashboardPrimaryButtonClass = (colorClasses: string) =>
  `inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm ${colorClasses}`;

export const dashboardSecondaryButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-600';

export const dashboardIconButtonClass =
  'app-icon-button rounded-lg text-slate-500 hover:bg-gray-100';

export const dashboardTabGroupClass =
  'flex w-full flex-wrap gap-1 rounded-xl bg-gray-100 p-1 lg:w-auto';

export const dashboardToolbarClass =
  'flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between';

export const dashboardTabClass = (active: boolean, activeTextClass: string) =>
  [
    'min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition-all',
    active ? `bg-white shadow-sm ${activeTextClass}` : 'text-slate-500 hover:text-slate-700',
  ].join(' ');

export const dashboardSelectableCardClass = (active: boolean, activeClass: string) =>
  [
    'w-full rounded-lg border p-3 text-left transition-all',
    active ? activeClass : 'bg-white border-gray-100 hover:border-gray-300',
  ].join(' ');
