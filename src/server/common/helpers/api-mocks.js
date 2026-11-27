// Dummy backend responses keyed by 'METHOD path'; remove entries as real endpoints are agreed.
export const apiMocks = {
  'GET /facilities': () => [
    {
      id: 'f-003',
      name: 'Celsa Manufacturing (UK) Limited, Tremorfa Melt Shop',
      status: 'report-in-progress'
    },
    {
      id: 'f-004',
      name: 'Celsa Cardiff Scrap Yard',
      status: 'report-submitted'
    },
    {
      id: 'f-005',
      name: 'Celsa Newport Scrap Yard',
      status: 'report-rejected'
    },
    {
      id: 'f-006',
      name: 'Celsa Swansea Scrap Yard',
      status: 'not-started'
    },
    {
      id: 'f-007',
      name: 'Celsa Wrexham Scrap Yard',
      status: 'report-approved'
    }
  ]
}
