/* eslint-disable camelcase */
import './_ContentTable.scss';

import { Link, withRouter } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { SortByDirection, Table, TableBody, TableHeader, TableVariant, sortable } from '@patternfly/react-table';

import CheckCircleIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon';
import { PrimaryToolbar } from '@redhat-cloud-services/frontend-components/PrimaryToolbar';
import PropTypes from 'prop-types';
import TimesCircleIcon from '@patternfly/react-icons/dist/js/icons/times-circle-icon';
import debounce from '../../Utilities/Debounce';
import global_palette_green_500 from '@patternfly/react-tokens/dist/js/global_palette_green_500';
import global_palette_red_100 from '@patternfly/react-tokens/dist/js/global_palette_red_100';

const ContentTable = ({ data, hits }) => {
    // Add a dummy empty first column to escape the "first column sort + text filter" issue.
    const columns = [
        { title: '' },  // dummy empty first column
        { title: 'Active', transforms: [sortable] },
        { title: 'Plugin', transforms: [sortable] },
        { title: 'Error Key', transforms: [sortable] },
        { title: 'Product Code', transforms: [sortable] },
        { title: 'Role', transforms: [sortable] },
        { title: 'Category', transforms: [sortable] },
        { title: 'Hits' },
    ];
    const [sort, setSort] = useState({ index: 2, direction: 'asc' });
    const [rows, setRows] = useState([]);
    const [searchText, setSearchText] = useState('');
    const debouncedSearchText = debounce(searchText, 800);

    const sortBy = (key) => {
        return (a, b) => (a[key] > b[key]) ? 1 : ((b[key] > a[key]) ? -1 : 0);
    };

    const buildRows = (data) => data.flatMap((item, key) => {
        const isValidSearchText = debouncedSearchText.length === 0
            || item.name.toLowerCase().includes(debouncedSearchText.toLowerCase())
            || item.plugin.toLowerCase().includes(debouncedSearchText.toLowerCase())
            || item.error_key.toLowerCase().includes(debouncedSearchText.toLowerCase());

        return isValidSearchText ? [{
            cells: ['', {  // dummy empty first column
                title: <span key={key}> {item.status === 'active' ?
                    <CheckCircleIcon color={global_palette_green_500.value} /> : <TimesCircleIcon color={global_palette_red_100.value} />}</span>
            }, {
                title: <Link key={key} to={`/preview/${item.rule_id}`}> {item.plugin} </Link>
            }, `${item.error_key}`, `${item.product_code}`, `${item.role}`, `${item.category}`, hits[item.rule_id] || 0]
        }] : [];
    });

    const onSort = (_event, index, direction) => {
        const sortAttr = { 1: 'status', 2: 'plugin', 3: 'error_key', 4: 'product_code', 5: 'role', 6: 'category' };
        const sortedData = data.asMutable().concat().sort(sortBy(sortAttr[index]));
        setSort({ index, direction });
        setRows(buildRows(direction === SortByDirection.asc ? sortedData : sortedData.reverse()));
    };

    useEffect(() => {
        sort.index ? onSort(null, sort.index, sort.direction) : setRows(buildRows(data));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, debouncedSearchText]);

    return <React.Fragment>
        <PrimaryToolbar
            filterConfig={{
                items: [{
                    label: 'Recommendation',
                    filterValues: {
                        key: 'text-filter',
                        'aria-label': 'recommendation filter',
                        onChange: (event, value) => { setSearchText(value); },
                        value: searchText
                    }
                }]
            }}
        />
        <Table aria-label="content preview table" variant={TableVariant.compact} sortBy={sort} onSort={onSort} cells={columns} rows={rows}>
            <TableHeader />
            <TableBody />
        </Table>
    </React.Fragment>;
};

ContentTable.propTypes = {
    data: PropTypes.array,
    hits: PropTypes.object
};

export default withRouter(ContentTable);
