import React from 'react';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const BackToAjustes = () => (
    <div className="mb-4">
        <Link to="/ajustes">
            <Button icon={<ArrowLeftOutlined />} type="default">Volver a Ajustes</Button>
        </Link>
    </div>
);

export default BackToAjustes;
