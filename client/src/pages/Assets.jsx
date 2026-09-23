import {
  useState,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import api from '../lib/api';

import {
  Download,
  Filter,
  Laptop,
  Monitor,
  Server,
  Smartphone,
  FileText,
  MoreHorizontal,
  Plus,
  QrCode,
  RotateCcw,
  Search,
  ShieldCheck,
  RefreshCw,
  X,
  ChevronDown,
} from 'lucide-react';

import {
  Badge,
  Button,
  EmptyState,
  Info,
  Modal,
  PageHeader,
} from '../components/ui';


/* =========================================================
   Helpers
========================================================= */

function extractData(response) {
  if (Array.isArray(response)) {
    return response;
  }

  return response?.data ?? response;
}


function displayValue(
  value,
  fallback = 'Not provided'
) {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    value === 'null'
  ) {
    return fallback;
  }

  return String(value);
}


function formatDate(value) {
  if (!value) {
    return 'Not provided';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}


function formatDateTime(value) {
  if (!value) {
    return 'Not provided';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}


function formatCurrency(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'Not provided';
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return value;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(number);
}


function formatLabel(value) {
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}


/* =========================================================
   Flatten hierarchical API data
========================================================= */

function flattenTree(
  nodes,
  parentPath = ''
) {
  const result = [];

  if (!Array.isArray(nodes)) {
    return result;
  }

  nodes.forEach((node) => {
    const currentPath = parentPath
      ? `${parentPath} / ${node.name}`
      : node.name;

    result.push({
      ...node,
      displayName: currentPath,
    });

    if (
      Array.isArray(node.children) &&
      node.children.length > 0
    ) {
      result.push(
        ...flattenTree(
          node.children,
          currentPath
        )
      );
    }
  });

  return result;
}


/* =========================================================
   Category icon
========================================================= */

const getIconForCategory = (category) => {
  if (!category) {
    return Laptop;
  }

  const lower = String(category).toLowerCase();

  if (lower.includes('laptop')) {
    return Laptop;
  }

  if (lower.includes('monitor')) {
    return Monitor;
  }

  if (lower.includes('server')) {
    return Server;
  }

  if (
    lower.includes('smartphone') ||
    lower.includes('mobile')
  ) {
    return Smartphone;
  }

  return FileText;
};


/* =========================================================
   Warranty filter
========================================================= */

function matchesWarrantyFilter(
  asset,
  warrantyFilter
) {
  if (
    !warrantyFilter ||
    warrantyFilter === 'all'
  ) {
    return true;
  }

  const expiry =
    asset.warranty_expiry;

  /*
   * No warranty date.
   */
  if (warrantyFilter === 'none') {
    return !expiry;
  }

  /*
   * All other warranty filters require
   * an expiry date.
   */
  if (!expiry) {
    return false;
  }

  const expiryDate = new Date(expiry);

  if (Number.isNaN(expiryDate.getTime())) {
    return false;
  }

  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const expiryDay = new Date(
    expiryDate
  );

  expiryDay.setHours(
    0,
    0,
    0,
    0
  );


  /*
   * Already expired.
   */
  if (warrantyFilter === 'expired') {
    return expiryDay < today;
  }


  /*
   * Currently active.
   */
  if (warrantyFilter === 'active') {
    return expiryDay >= today;
  }


  /*
   * Expiring within the next 30 days.
   */
  if (warrantyFilter === 'expiring') {
    const thirtyDaysFromNow =
      new Date(today);

    thirtyDaysFromNow.setDate(
      thirtyDaysFromNow.getDate() + 30
    );

    return (
      expiryDay >= today &&
      expiryDay <= thirtyDaysFromNow
    );
  }

  return true;
}


/* =========================================================
   Fetch complete asset details
========================================================= */

async function fetchAssetDetails(asset) {
  /*
   * First get the complete asset record.
   */
  const assetResponse =
    await api.get(
      `/api/assets/${asset.id}`
    );

  const fullAsset =
    extractData(assetResponse);


  /*
   * Fetch related records using IDs.
   */
  const requests = [];


  /* Category */

  if (fullAsset?.category_id) {
    requests.push(
      api
        .get(
          `/api/categories/${fullAsset.category_id}`
        )
        .then((response) => ({
          type: 'category',
          data: extractData(response),
        }))
        .catch((error) => {
          console.error(
            'Failed to fetch category',
            error
          );

          return {
            type: 'category',
            data: null,
          };
        })
    );
  }


  /* Location */

  if (fullAsset?.location_id) {
    requests.push(
      api
        .get(
          `/api/locations/${fullAsset.location_id}`
        )
        .then((response) => ({
          type: 'location',
          data: extractData(response),
        }))
        .catch((error) => {
          console.error(
            'Failed to fetch location',
            error
          );

          return {
            type: 'location',
            data: null,
          };
        })
    );
  }


  /* Supplier */

  if (fullAsset?.supplier_id) {
    requests.push(
      api
        .get(
          `/api/suppliers/${fullAsset.supplier_id}`
        )
        .then((response) => ({
          type: 'supplier',
          data: extractData(response),
        }))
        .catch((error) => {
          console.error(
            'Failed to fetch supplier',
            error
          );

          return {
            type: 'supplier',
            data: null,
          };
        })
    );
  }


  /* Assigned user */

  if (fullAsset?.assigned_to) {
    requests.push(
      api
        .get(
          `/api/users/${fullAsset.assigned_to}`
        )
        .then((response) => ({
          type: 'assignedTo',
          data: extractData(response),
        }))
        .catch((error) => {
          console.error(
            'Failed to fetch assigned user',
            error
          );

          return {
            type: 'assignedTo',
            data: null,
          };
        })
    );
  }


  const relatedRecords =
    await Promise.all(requests);


  const details = {
    asset: fullAsset,
    category: null,
    location: null,
    supplier: null,
    assignedTo: null,
  };


  relatedRecords.forEach(
    (record) => {
      details[record.type] =
        record.data;
    }
  );


  return details;
}


/* =========================================================
   Assets Page
========================================================= */

export default function Assets({
  notify,
}) {
  /* =======================================================
     Main state
  ======================================================= */

  const [assets, setAssets] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState('');

  const [filter, setFilter] =
    useState('All assets');

  const [modal, setModal] =
    useState(null);

  const [selectedAsset, setSelectedAsset] =
    useState(null);

  const [assetDetails, setAssetDetails] =
    useState(null);

  const [
    assetDetailsLoading,
    setAssetDetailsLoading,
  ] = useState(false);


  /* =======================================================
     Toolbar state
  ======================================================= */

  const [showFilters, setShowFilters] =
    useState(false);

  const [showMore, setShowMore] =
    useState(false);


  /* =======================================================
     Dynamic filter data
  ======================================================= */

  const [filterOptions, setFilterOptions] =
    useState({
      categories: [],
      locations: [],
      suppliers: [],
    });

  const [
    filterOptionsLoading,
    setFilterOptionsLoading,
  ] = useState(false);


  /* =======================================================
     Advanced filters
  ======================================================= */

  const [
    advancedFilters,
    setAdvancedFilters,
  ] = useState({
    status: '',
    category: '',
    location: '',
    supplier: '',
    assignment: '',
    warranty: '',
    active: '',
  });


  /* =======================================================
     Pagination
  ======================================================= */

  const [currentPage, setCurrentPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(10);


  /* =======================================================
     Refs
  ======================================================= */

  const filterRef =
    useRef(null);

  const moreRef =
    useRef(null);


  /* =======================================================
     Fetch assets
  ======================================================= */

  const fetchAssets = async () => {
    try {
      setLoading(true);

      const response =
        await api.get(
          '/api/assets'
        );

      const data =
        extractData(response);

      setAssets(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        'Failed to fetch assets',
        error
      );

      notify(
        'Failed to load assets'
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchAssets();
  }, []);


  /* =======================================================
     Fetch dynamic filter data
  ======================================================= */

  useEffect(() => {
    const loadFilterOptions =
      async () => {
        try {
          setFilterOptionsLoading(
            true
          );

          const [
            categoriesResponse,
            locationsResponse,
            suppliersResponse,
          ] = await Promise.all([
            api.get(
              '/api/categories/tree'
            ),

            api.get(
              '/api/locations/tree'
            ),

            api.get(
              '/api/suppliers'
            ),
          ]);


          const categories =
            extractData(
              categoriesResponse
            );

          const locations =
            extractData(
              locationsResponse
            );

          const suppliers =
            extractData(
              suppliersResponse
            );


          setFilterOptions({
            categories:
              flattenTree(
                categories
              ),

            locations:
              flattenTree(
                locations
              ),

            suppliers:
              Array.isArray(
                suppliers
              )
                ? suppliers
                : [],
          });
        } catch (error) {
          console.error(
            'Failed to load filter options',
            error
          );
        } finally {
          setFilterOptionsLoading(
            false
          );
        }
      };

    loadFilterOptions();
  }, []);


  /* =======================================================
     Close dropdowns on outside click
  ======================================================= */

  useEffect(() => {
    const handleOutsideClick =
      (event) => {
        if (
          filterRef.current &&
          !filterRef.current.contains(
            event.target
          )
        ) {
          setShowFilters(false);
        }

        if (
          moreRef.current &&
          !moreRef.current.contains(
            event.target
          )
        ) {
          setShowMore(false);
        }
      };

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };
  }, []);


  /* =======================================================
     Reset pagination when filters/search change
  ======================================================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    filter,
    advancedFilters,
  ]);


  /* =======================================================
     Open asset details
  ======================================================= */

  const handleAssetSelect =
    async (asset) => {
      try {
        setSelectedAsset(asset);

        setAssetDetails(null);

        setAssetDetailsLoading(
          true
        );

        const details =
          await fetchAssetDetails(
            asset
          );

        setAssetDetails(details);
      } catch (error) {
        console.error(
          'Failed to fetch asset details',
          error
        );

        notify(
          'Failed to load asset details'
        );
      } finally {
        setAssetDetailsLoading(
          false
        );
      }
    };


  /* =======================================================
     Advanced filter helpers
  ======================================================= */

  const updateAdvancedFilter = (
    key,
    value
  ) => {
    setAdvancedFilters(
      (current) => ({
        ...current,
        [key]: value,
      })
    );
  };


  const clearAdvancedFilters =
    () => {
      setAdvancedFilters({
        status: '',
        category: '',
        location: '',
        supplier: '',
        assignment: '',
        warranty: '',
        active: '',
      });

      setFilter(
        'All assets'
      );
    };


  const clearAllFilters = () => {
    clearAdvancedFilters();

    setSearch('');

    setCurrentPage(1);
  };


  const activeFilterCount =
    Object.values(
      advancedFilters
    ).filter(Boolean).length;


  /* =======================================================
     Filter assets
     
     IMPORTANT:
     Pagination happens AFTER this calculation.
  ======================================================= */

  const filteredAssets =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return assets.filter(
        (asset) => {

          /* ---------------------------------------------
             Search
          --------------------------------------------- */

          const searchText = [
            asset.asset_number,
            asset.name,
            asset.asset_tag,
            asset.serial_number,
            asset.brand,
            asset.model,
            asset.category_name,
            asset.location_name,
            asset.location_path,
            asset.assigned_to_name,
            asset.supplier_name,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();


          const matchesSearch =
            !query ||
            searchText.includes(
              query
            );


          /* ---------------------------------------------
             Quick filter tabs
          --------------------------------------------- */

          let matchesQuickFilter =
            true;


          if (
            filter === 'Available'
          ) {
            matchesQuickFilter =
              asset.status
                ?.toLowerCase() ===
              'available';
          }


          if (
            filter === 'Assigned'
          ) {
            matchesQuickFilter =
              asset.status
                ?.toLowerCase() ===
                'assigned' ||
              Boolean(
                asset.assigned_to
              );
          }


          if (
            filter === 'Maintenance'
          ) {
            matchesQuickFilter =
              asset.status
                ?.toLowerCase() ===
              'maintenance';
          }


          if (
            filter === 'Hardware'
          ) {
            matchesQuickFilter =
              asset.category_type
                ?.toLowerCase() ===
              'hardware';
          }


          if (
            filter === 'Software'
          ) {
            matchesQuickFilter =
              asset.category_type
                ?.toLowerCase() ===
              'software';
          }


          /* ---------------------------------------------
             Status
          --------------------------------------------- */

          const matchesStatus =
            !advancedFilters.status ||
            asset.status
              ?.toLowerCase() ===
              advancedFilters.status
                .toLowerCase();


          /* ---------------------------------------------
             Category
          --------------------------------------------- */

          const matchesCategory =
            !advancedFilters.category ||
            asset.category_id ===
              advancedFilters.category;


          /* ---------------------------------------------
             Location
          --------------------------------------------- */

          const matchesLocation =
            !advancedFilters.location ||
            asset.location_id ===
              advancedFilters.location;


          /* ---------------------------------------------
             Supplier
          --------------------------------------------- */

          const matchesSupplier =
            !advancedFilters.supplier ||
            asset.supplier_id ===
              advancedFilters.supplier;


          /* ---------------------------------------------
             Assignment
          --------------------------------------------- */

          let matchesAssignment =
            true;


          if (
            advancedFilters.assignment ===
            'assigned'
          ) {
            matchesAssignment =
              Boolean(
                asset.assigned_to
              );
          }


          if (
            advancedFilters.assignment ===
            'unassigned'
          ) {
            matchesAssignment =
              !asset.assigned_to;
          }


          /* ---------------------------------------------
             Warranty
          --------------------------------------------- */

          const matchesWarranty =
            matchesWarrantyFilter(
              asset,
              advancedFilters.warranty
            );


          /* ---------------------------------------------
             Active record
          --------------------------------------------- */

          let matchesActive =
            true;


          if (
            advancedFilters.active ===
            'active'
          ) {
            matchesActive =
              asset.is_active !== false;
          }


          if (
            advancedFilters.active ===
            'inactive'
          ) {
            matchesActive =
              asset.is_active === false;
          }


          return (
            matchesSearch &&
            matchesQuickFilter &&
            matchesStatus &&
            matchesCategory &&
            matchesLocation &&
            matchesSupplier &&
            matchesAssignment &&
            matchesWarranty &&
            matchesActive
          );
        }
      );
    }, [
      assets,
      search,
      filter,
      advancedFilters,
    ]);


  /* =======================================================
     Pagination
     
     This MUST happen after filteredAssets.
  ======================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredAssets.length /
          pageSize
      )
    );


  const safeCurrentPage =
    Math.min(
      currentPage,
      totalPages
    );


  const startIndex =
    (safeCurrentPage - 1) *
    pageSize;


  const endIndex =
    startIndex + pageSize;


  const paginatedAssets =
    filteredAssets.slice(
      startIndex,
      endIndex
    );


  /* =======================================================
     Change page
  ======================================================= */

  const goToPage = (page) => {
    setCurrentPage(
      Math.max(
        1,
        Math.min(
          page,
          totalPages
        )
      )
    );
  };


  /* =======================================================
     CSV export
  ======================================================= */

  const exportAssets = () => {
    if (
      filteredAssets.length ===
      0
    ) {
      notify(
        'There are no assets to export.'
      );

      return;
    }


    const headers = [
      'Asset Number',
      'Asset Name',
      'Asset Tag',
      'Serial Number',
      'Category',
      'Category Type',
      'Brand',
      'Model',
      'Status',
      'Assigned To',
      'Employee ID',
      'Location',
      'Location Path',
      'Supplier',
      'Purchase Date',
      'Purchase Price',
      'Invoice Number',
      'Warranty Expiry',
      'Next Maintenance',
      'Active',
      'Notes',
    ];


    const escapeCSV = (
      value
    ) => {
      if (
        value === null ||
        value === undefined
      ) {
        return '';
      }

      return `"${String(
        value
      ).replace(
        /"/g,
        '""'
      )}"`;
    };


    const rows =
      filteredAssets.map(
        (asset) =>
          [
            asset.asset_number,
            asset.name,
            asset.asset_tag,
            asset.serial_number,
            asset.category_name,
            asset.category_type,
            asset.brand,
            asset.model,
            asset.status,
            asset.assigned_to_name,
            asset.assigned_to_emp_id,
            asset.location_name,
            asset.location_path,
            asset.supplier_name,
            asset.purchase_date,
            asset.purchase_price,
            asset.invoice_number,
            asset.warranty_expiry,
            asset.next_maintenance_date,
            asset.is_active
              ? 'Yes'
              : 'No',
            asset.notes,
          ]
            .map(escapeCSV)
            .join(',')
      );


    const csv = [
      headers
        .map(escapeCSV)
        .join(','),
      ...rows,
    ].join('\n');


    const blob =
      new Blob(
        [csv],
        {
          type:
            'text/csv;charset=utf-8;',
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        'a'
      );

    link.href = url;


    const date =
      new Date()
        .toISOString()
        .slice(0, 10);


    link.download =
      `assets-${date}.csv`;


    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(
      url
    );


    notify(
      `${filteredAssets.length} asset${
        filteredAssets.length === 1
          ? ''
          : 's'
      } exported successfully.`
    );
  };


  /* =======================================================
     Refresh
  ======================================================= */

  const handleRefresh =
    async () => {
      setShowMore(false);

      await fetchAssets();

      notify(
        'Assets refreshed successfully.'
      );
    };


  /* =======================================================
     Add asset
  ======================================================= */

  const addAsset = async (
    event
  ) => {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget
      );


    const newAsset = {
      name: form.get('name'),
      category:
        form.get('category'),
      serial:
        form.get('serial') ||
        undefined,
      value:
        form.get('value') ||
        undefined,
      source:
        form.get('source') ||
        'Internal',
    };


    try {
      await api.post(
        '/api/assets',
        newAsset
      );

      setModal(null);

      notify(
        'Asset created successfully.'
      );

      await fetchAssets();

      setCurrentPage(1);
    } catch (error) {
      console.error(
        'Failed to create asset',
        error
      );

      notify(
        'Failed to create asset'
      );
    }
  };


  /* =======================================================
     Render
  ======================================================= */

  return (
    <div className="page-stack">

      <PageHeader
        eyebrow="Inventory / Assets"
        title="Assets"
        description="Track every device, license, and customer-provided asset in one place."
        action={
          <Button
            icon={Plus}
            onClick={() =>
              setModal('add')
            }
          >
            Add asset
          </Button>
        }
      />


      {/* ===================================================
          Asset panel
      =================================================== */}

      <div className="panel asset-panel">

        {/* ===============================================
            Toolbar
        =============================================== */}

        <div className="toolbar">

          <div className="search-field">

            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search by asset number, name, serial..."
            />

          </div>


          <div className="toolbar-actions">

            {/* ===========================================
                Filters
            =========================================== */}

            <div
              className="toolbar-menu-wrapper"
              ref={filterRef}
            >

              <button
                type="button"
                className={`filter-button ${
                  showFilters ||
                  activeFilterCount > 0
                    ? 'active'
                    : ''
                }`}
                onClick={() => {
                  setShowFilters(
                    (current) =>
                      !current
                  );

                  setShowMore(false);
                }}
              >

                <Filter size={15} />

                Filters

                {activeFilterCount >
                  0 && (
                  <span>
                    {activeFilterCount}
                  </span>
                )}

                <ChevronDown
                  size={14}
                />

              </button>


              {showFilters && (
                <div className="toolbar-popover filter-popover">

                  <div className="popover-header">

                    <div>

                      <strong>
                        Filter assets
                      </strong>

                      <span>
                        Narrow down your inventory
                      </span>

                    </div>


                    <button
                      type="button"
                      className="popover-close"
                      onClick={() =>
                        setShowFilters(
                          false
                        )
                      }
                    >
                      <X size={16} />
                    </button>

                  </div>


                  <div className="popover-body">

                    {/* Status */}

                    <label className="filter-field">

                      <span>
                        Status
                      </span>

                      <select
                        value={
                          advancedFilters.status
                        }
                        onChange={(event) =>
                          updateAdvancedFilter(
                            'status',
                            event.target.value
                          )
                        }
                      >

                        <option value="">
                          All statuses
                        </option>

                        <option value="available">
                          Available
                        </option>

                        <option value="assigned">
                          Assigned
                        </option>

                        <option value="maintenance">
                          Maintenance
                        </option>

                        <option value="retired">
                          Retired
                        </option>

                      </select>

                    </label>


                    {/* Category */}

                    <label className="filter-field">

                      <span>
                        Category
                      </span>

                      <select
                        value={
                          advancedFilters.category
                        }
                        onChange={(event) =>
                          updateAdvancedFilter(
                            'category',
                            event.target.value
                          )
                        }
                      >

                        <option value="">
                          All categories
                        </option>

                        {filterOptionsLoading ? (
                          <option disabled>
                            Loading categories...
                          </option>
                        ) : (
                          filterOptions.categories.map(
                            (category) => (
                              <option
                                key={
                                  category.id
                                }
                                value={
                                  category.id
                                }
                              >
                                {
                                  category.displayName
                                }
                              </option>
                            )
                          )
                        )}

                      </select>

                    </label>


                    {/* Location */}

                    <label className="filter-field">

                      <span>
                        Location
                      </span>

                      <select
                        value={
                          advancedFilters.location
                        }
                        onChange={(event) =>
                          updateAdvancedFilter(
                            'location',
                            event.target.value
                          )
                        }
                      >

                        <option value="">
                          All locations
                        </option>

                        {filterOptionsLoading ? (
                          <option disabled>
                            Loading locations...
                          </option>
                        ) : (
                          filterOptions.locations.map(
                            (location) => (
                              <option
                                key={
                                  location.id
                                }
                                value={
                                  location.id
                                }
                              >
                                {
                                  location.displayName
                                }
                              </option>
                            )
                          )
                        )}

                      </select>

                    </label>


                    {/* Supplier */}

                    <label className="filter-field">

                      <span>
                        Supplier
                      </span>

                      <select
                        value={
                          advancedFilters.supplier
                        }
                        onChange={(event) =>
                          updateAdvancedFilter(
                            'supplier',
                            event.target.value
                          )
                        }
                      >

                        <option value="">
                          All suppliers
                        </option>

                        {filterOptionsLoading ? (
                          <option disabled>
                            Loading suppliers...
                          </option>
                        ) : (
                          filterOptions.suppliers.map(
                            (supplier) => (
                              <option
                                key={
                                  supplier.id
                                }
                                value={
                                  supplier.id
                                }
                              >
                                {
                                  supplier.name
                                }
                              </option>
                            )
                          )
                        )}

                      </select>

                    </label>


                    {/* Assignment */}

                    <label className="filter-field">

                      <span>
                        Assignment
                      </span>

                      <select
                        value={
                          advancedFilters.assignment
                        }
                        onChange={(event) =>
                          updateAdvancedFilter(
                            'assignment',
                            event.target.value
                          )
                        }
                      >

                        <option value="">
                          All assets
                        </option>

                        <option value="assigned">
                          Assigned
                        </option>

                        <option value="unassigned">
                          Unassigned
                        </option>

                      </select>

                    </label>


                    {/* Warranty */}

                    <label className="filter-field">

                      <span>
                        Warranty
                      </span>

                      <select
                        value={
                          advancedFilters.warranty
                        }
                        onChange={(event) =>
                          updateAdvancedFilter(
                            'warranty',
                            event.target.value
                          )
                        }
                      >

                        <option value="">
                          All warranties
                        </option>

                        <option value="active">
                          Active warranty
                        </option>

                        <option value="expiring">
                          Expiring within 30 days
                        </option>

                        <option value="expired">
                          Expired
                        </option>

                        <option value="none">
                          No warranty
                        </option>

                      </select>

                    </label>


                    {/* Active */}

                    <label className="filter-field">

                      <span>
                        Record status
                      </span>

                      <select
                        value={
                          advancedFilters.active
                        }
                        onChange={(event) =>
                          updateAdvancedFilter(
                            'active',
                            event.target.value
                          )
                        }
                      >

                        <option value="">
                          All records
                        </option>

                        <option value="active">
                          Active
                        </option>

                        <option value="inactive">
                          Inactive
                        </option>

                      </select>

                    </label>

                  </div>


                  <div className="popover-footer">

                    <button
                      type="button"
                      className="text-button"
                      onClick={
                        clearAdvancedFilters
                      }
                    >
                      Clear all
                    </button>

                    <Button
                      onClick={() =>
                        setShowFilters(
                          false
                        )
                      }
                    >
                      Apply filters
                    </Button>

                  </div>

                </div>
              )}

            </div>


            {/* ===========================================
                Export
            =========================================== */}

            <button
              type="button"
              className="icon-button"
              title="Export filtered assets"
              onClick={
                exportAssets
              }
            >
              <Download size={17} />
            </button>


            {/* ===========================================
                More
            =========================================== */}

            <div
              className="toolbar-menu-wrapper"
              ref={moreRef}
            >

              <button
                type="button"
                className={`icon-button ${
                  showMore
                    ? 'active'
                    : ''
                }`}
                title="More actions"
                onClick={() => {
                  setShowMore(
                    (current) =>
                      !current
                  );

                  setShowFilters(false);
                }}
              >
                <MoreHorizontal
                  size={17}
                />
              </button>


              {showMore && (
                <div className="toolbar-popover more-popover">

                  <button
                    type="button"
                    className="popover-action"
                    onClick={
                      handleRefresh
                    }
                  >
                    <RefreshCw
                      size={16}
                    />

                    <span>
                      Refresh assets
                    </span>
                  </button>


                  <button
                    type="button"
                    className="popover-action"
                    onClick={() => {
                      clearAllFilters();

                      setShowMore(
                        false
                      );
                    }}
                  >
                    <X size={16} />

                    <span>
                      Clear all filters
                    </span>
                  </button>

                </div>
              )}

            </div>

          </div>

        </div>


        {/* =================================================
            Quick filter tabs
        ================================================= */}

        <div className="filter-tabs">

          {[
            'All assets',
            'Hardware',
            'Software',
            'Available',
            'Assigned',
            'Maintenance',
          ].map((tab) => (

            <button
              key={tab}
              type="button"
              className={
                filter === tab
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFilter(tab)
              }
            >
              {tab}
            </button>

          ))}

        </div>


        {/* =================================================
            Table
        ================================================= */}

        <div className="table-wrap">

          {loading ? (

            <p>
              Loading assets...
            </p>

          ) : (

            <>

              <table>

                <thead>

                  <tr>

                    <th>
                      Asset
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Assigned to
                    </th>

                    <th>
                      Location
                    </th>

                    <th>
                      Warranty
                    </th>

                    <th />

                  </tr>

                </thead>


                <tbody>

                  {paginatedAssets.map(
                    (asset) => {

                      const Icon =
                        getIconForCategory(
                          asset.category_name
                        );


                      return (
                        <tr
                          key={asset.id}
                          onClick={() =>
                            handleAssetSelect(
                              asset
                            )
                          }
                        >

                          {/* Asset */}

                          <td>

                            <div className="asset-cell">

                              <div className="asset-thumb">
                                <Icon
                                  size={17}
                                />
                              </div>

                              <div>

                                <strong className="mono">
                                  {
                                    displayValue(
                                      asset.asset_number
                                    )
                                  }
                                </strong>

                                <span>
                                  {
                                    displayValue(
                                      asset.name
                                    )
                                  }
                                </span>

                              </div>

                            </div>

                          </td>


                          {/* Category */}

                          <td>
                            {
                              displayValue(
                                asset.category_name
                              )
                            }
                          </td>


                          {/* Status */}

                          <td>

                            <Badge>
                              {
                                displayValue(
                                  asset.status
                                )
                              }
                            </Badge>

                          </td>


                          {/* Assigned */}

                          <td>
                            {
                              asset.assigned_to_name ||
                              'Not assigned'
                            }
                          </td>


                          {/* Location */}

                          <td className="muted-cell">
                            {
                              asset.location_name ||
                              'Not provided'
                            }
                          </td>


                          {/* Warranty */}

                          <td>

                            {asset.warranty_expiry
                              ? formatDate(
                                  asset.warranty_expiry
                                )
                              : 'No warranty'}

                          </td>


                          {/* Actions */}

                          <td>

                            <button
                              type="button"
                              className="row-action"
                              onClick={(
                                event
                              ) => {

                                event.stopPropagation();

                                handleAssetSelect(
                                  asset
                                );

                              }}
                            >

                              <MoreHorizontal
                                size={17}
                              />

                            </button>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>


              {filteredAssets.length ===
                0 && (
                <EmptyState
                  title="No assets found"
                  text="Try another search or clear the current filters."
                />
              )}

            </>
          )}

        </div>


        {/* =================================================
            Real Pagination Footer
        ================================================= */}

        <div className="table-footer">

          <div className="table-footer-info">

            <span>

              Showing{' '}

              <strong>
                {filteredAssets.length ===
                0
                  ? 0
                  : startIndex + 1}
              </strong>

              {' '}to{' '}

              <strong>
                {Math.min(
                  endIndex,
                  filteredAssets.length
                )}
              </strong>

              {' '}of{' '}

              <strong>
                {filteredAssets.length}
              </strong>

              {' '}assets

              {filteredAssets.length !==
                assets.length && (
                <>
                  {' '}
                  <span className="muted-cell">
                    ({assets.length} total)
                  </span>
                </>
              )}

            </span>


            {/* Page size */}

            <label className="page-size-control">

              <span>
                Rows
              </span>

              <select
                value={pageSize}
                onChange={(event) => {

                  setPageSize(
                    Number(
                      event.target.value
                    )
                  );

                  setCurrentPage(1);

                }}
              >

                <option value={10}>
                  10
                </option>

                <option value={25}>
                  25
                </option>

                <option value={50}>
                  50
                </option>

                <option value={100}>
                  100
                </option>

              </select>

            </label>

          </div>


          {/* Pagination */}

          <div className="pagination">

            {/* Previous */}

            <button
              type="button"
              disabled={
                safeCurrentPage === 1
              }
              onClick={() =>
                goToPage(
                  safeCurrentPage - 1
                )
              }
              aria-label="Previous page"
            >
              ←
            </button>


            {/* Page numbers */}

            {Array.from(
              {
                length: totalPages,
              },
              (_, index) => {

                const page =
                  index + 1;

                return (
                  <button
                    key={page}
                    type="button"
                    className={
                      safeCurrentPage ===
                      page
                        ? 'current'
                        : ''
                    }
                    onClick={() =>
                      goToPage(page)
                    }
                  >
                    {page}
                  </button>
                );

              }
            )}


            {/* Next */}

            <button
              type="button"
              disabled={
                safeCurrentPage ===
                totalPages
              }
              onClick={() =>
                goToPage(
                  safeCurrentPage + 1
                )
              }
              aria-label="Next page"
            >
              →
            </button>

          </div>

        </div>

      </div>


      {/* =================================================
          Add Asset Modal
      ================================================= */}

      {modal === 'add' && (

        <Modal
          title="Add a new asset"
          onClose={() =>
            setModal(null)
          }
        >

          <form
            className="form-grid"
            onSubmit={addAsset}
          >

            <label>

              Asset name

              <input
                name="name"
                required
                placeholder="e.g. Lenovo ThinkPad X1"
              />

            </label>


            <label>

              Category

              <select name="category">

                <option>
                  Laptops
                </option>

                <option>
                  Desktops
                </option>

                <option>
                  Monitors & Displays
                </option>

                <option>
                  Test Benches
                </option>

                <option>
                  Mobile Devices
                </option>

              </select>

            </label>


            <label>

              Serial number

              <input
                name="serial"
                placeholder="Optional serial number"
              />

            </label>


            <label>

              Purchase value

              <input
                name="value"
                placeholder="₹0.00"
              />

            </label>


            <label>

              Source

              <select name="source">

                <option>
                  Internal
                </option>

                <option>
                  Customer-provided
                </option>

              </select>

            </label>


            <div className="form-note">

              <ShieldCheck
                size={16}
              />

              The asset number will
              be generated
              automatically from its
              category.

            </div>


            <div className="modal-actions">

              <Button
                variant="secondary"
                onClick={() =>
                  setModal(null)
                }
              >
                Cancel
              </Button>

              <Button type="submit">
                Create asset
              </Button>

            </div>

          </form>

        </Modal>

      )}


      {/* =================================================
          Asset Detail
      ================================================= */}

      {selectedAsset && (

        <AssetDetail
          asset={selectedAsset}
          details={assetDetails}
          loading={
            assetDetailsLoading
          }
          onClose={() => {
            setSelectedAsset(null);
            setAssetDetails(null);
          }}
        />

      )}

    </div>
  );
}


/* =========================================================
   Asset Detail Modal
========================================================= */

function AssetDetail({
  asset,
  details,
  loading,
  onClose,
}) {
  const fullAsset =
    details?.asset || asset;


  const Icon =
    getIconForCategory(
      fullAsset.category_name ||
        details?.category?.name ||
        details?.category?.category_name
    );


  /* =======================================================
     Related information
  ======================================================= */

  const categoryName =
    details?.category?.name ||
    details?.category?.category_name ||
    fullAsset.category_name ||
    'Not provided';


  const categoryType =
    details?.category?.type ||
    details?.category?.category_type ||
    fullAsset.category_type ||
    'Not provided';


  const locationName =
    details?.location?.name ||
    details?.location?.location_name ||
    fullAsset.location_name ||
    'Not provided';


  const locationPath =
    fullAsset.location_path ||
    details?.location?.path ||
    details?.location?.location_path ||
    locationName;


  const supplierName =
    details?.supplier?.name ||
    details?.supplier?.supplier_name ||
    fullAsset.supplier_name ||
    'Not provided';


  const assignedToName =
    details?.assignedTo?.name ||
    details?.assignedTo?.full_name ||
    details?.assignedTo?.employee_name ||
    fullAsset.assigned_to_name ||
    'Not assigned';


  const assignedEmployeeId =
    details?.assignedTo?.employee_id ||
    details?.assignedTo?.emp_id ||
    fullAsset.assigned_to_emp_id ||
    'Not provided';


  const specifications =
    fullAsset.specifications || {};


  return (

    <Modal
      title={displayValue(
        fullAsset.name,
        'Asset details'
      )}
      onClose={onClose}
      wide
    >

      {loading ? (

        <div className="detail-loading">

          <p>
            Loading complete asset
            details...
          </p>

        </div>

      ) : (

        <>

          {/* =============================================
              Asset header
          ============================================= */}

          <div className="detail-top">

            <div className="detail-visual">
              <Icon size={38} />
            </div>


            <div>

              <p className="mono accent-text">
                {
                  displayValue(
                    fullAsset.asset_number
                  )
                }
              </p>

              <h3>
                {
                  displayValue(
                    fullAsset.name
                  )
                }
              </h3>

              <p>

                {categoryName}

                {fullAsset.brand
                  ? ` · ${fullAsset.brand}`
                  : ''}

                {fullAsset.model
                  ? ` · ${fullAsset.model}`
                  : ''}

              </p>

            </div>


            <Badge>
              {
                displayValue(
                  fullAsset.status
                )
              }
            </Badge>

          </div>


          {/* =============================================
              Asset information
          ============================================= */}

          <div className="detail-section">

            <div className="section-heading">

              <h3>
                Asset information
              </h3>

            </div>


            <div className="detail-grid">

              <Info
                label="Asset number"
                value={
                  fullAsset.asset_number
                }
                mono
              />

              <Info
                label="Asset tag"
                value={
                  fullAsset.asset_tag
                }
                mono
              />

              <Info
                label="Serial number"
                value={
                  fullAsset.serial_number
                }
                mono
              />

              <Info
                label="Brand"
                value={
                  fullAsset.brand
                }
              />

              <Info
                label="Model"
                value={
                  fullAsset.model
                }
              />

              <Info
                label="Status"
                value={
                  fullAsset.status
                }
              />

              <Info
                label="Category"
                value={
                  categoryName
                }
              />

              <Info
                label="Category type"
                value={
                  categoryType
                }
              />

            </div>

          </div>


          {/* =============================================
              Assignment & location
          ============================================= */}

          <div className="detail-section">

            <div className="section-heading">

              <h3>
                Assignment & location
              </h3>

            </div>


            <div className="detail-grid">

              <Info
                label="Assigned to"
                value={
                  assignedToName
                }
              />

              <Info
                label="Employee ID"
                value={
                  assignedEmployeeId
                }
                mono
              />

              <Info
                label="Assigned since"
                value={formatDate(
                  fullAsset.assigned_since
                )}
              />

              <Info
                label="Return required"
                value={
                  fullAsset.return_required
                    ? 'Yes'
                    : 'No'
                }
              />

              <Info
                label="Location"
                value={
                  locationName
                }
              />

              <Info
                label="Location path"
                value={
                  locationPath
                }
              />

              <Info
                label="Location ID"
                value={
                  fullAsset.location_id
                }
                mono
              />

            </div>

          </div>


          {/* =============================================
              Procurement
          ============================================= */}

          <div className="detail-section">

            <div className="section-heading">

              <h3>
                Procurement
              </h3>

            </div>


            <div className="detail-grid">

              <Info
                label="Supplier"
                value={
                  supplierName
                }
              />

              <Info
                label="Purchase date"
                value={formatDate(
                  fullAsset.purchase_date
                )}
              />

              <Info
                label="Purchase price"
                value={formatCurrency(
                  fullAsset.purchase_price
                )}
              />

              <Info
                label="Invoice number"
                value={
                  fullAsset.invoice_number
                }
                mono
              />

              <Info
                label="Warranty expiry"
                value={formatDate(
                  fullAsset.warranty_expiry
                )}
              />

              <Info
                label="Warranty terms"
                value={
                  fullAsset.warranty_terms
                }
              />

              <Info
                label="Supplier ID"
                value={
                  fullAsset.supplier_id
                }
                mono
              />

            </div>

          </div>


          {/* =============================================
              Specifications
          ============================================= */}

          {Object.keys(
            specifications
          ).length > 0 && (

            <div className="detail-section">

              <div className="section-heading">

                <h3>
                  Specifications
                </h3>

              </div>


              <div className="detail-grid">

                {Object.entries(
                  specifications
                ).map(
                  ([key, value]) => (

                    <Info
                      key={key}
                      label={formatLabel(
                        key
                      )}
                      value={
                        typeof value ===
                        'object'
                          ? JSON.stringify(
                              value
                            )
                          : displayValue(
                              value
                            )
                      }
                    />

                  )
                )}

              </div>

            </div>

          )}


          {/* =============================================
              Maintenance
          ============================================= */}

          <div className="detail-section">

            <div className="section-heading">

              <h3>
                Maintenance
              </h3>

            </div>


            <div className="detail-grid">

              <Info
                label="Next maintenance"
                value={formatDate(
                  fullAsset.next_maintenance_date
                )}
              />

              <Info
                label="Maintenance interval"
                value={
                  fullAsset.maintenance_interval_days
                    ? `${fullAsset.maintenance_interval_days} days`
                    : 'Not configured'
                }
              />

            </div>

          </div>


          {/* =============================================
              Additional information
          ============================================= */}

          <div className="detail-section">

            <div className="section-heading">

              <h3>
                Additional information
              </h3>

            </div>


            <div className="detail-grid">

              <Info
                label="Notes"
                value={
                  fullAsset.notes
                }
              />

              <Info
                label="Active"
                value={
                  fullAsset.is_active
                    ? 'Yes'
                    : 'No'
                }
              />

              <Info
                label="Created"
                value={formatDateTime(
                  fullAsset.created_at
                )}
              />

              <Info
                label="Last updated"
                value={formatDateTime(
                  fullAsset.updated_at
                )}
              />

              <Info
                label="Photo"
                value={
                  fullAsset.photo_url ||
                  'No photo'
                }
              />

              <Info
                label="Category ID"
                value={
                  fullAsset.category_id
                }
                mono
              />

            </div>

          </div>


          {/* =============================================
              Actions
          ============================================= */}

          <div className="modal-actions">

            <Button
              variant="secondary"
              icon={QrCode}
            >
              View QR code
            </Button>

            <Button
              variant="secondary"
              icon={RotateCcw}
            >
              Rotate QR
            </Button>

            <Button
              onClick={onClose}
            >
              Close
            </Button>

          </div>

        </>

      )}

    </Modal>
  );
}