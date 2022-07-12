<?php
namespace Crimson\ProductSearch\Model;

use \Magento\Framework\Exception\NoSuchEntityException;
use \Magento\Framework\App\CacheInterface;
use \Magento\Framework\App\Cache\StateInterface;

class Search
    extends \Magento\Framework\Model\AbstractModel
    implements \Crimson\ProductSearch\Api\SearchInterface
{

    private $productCollection;

    private $serializer;

    private $request;

    /**
     * Search constructor.
     * @param \Magento\Framework\Model\Context $context
     * @param \Magento\Framework\Registry $registry
     * @param \Magento\Framework\Model\ResourceModel\AbstractResource|null $resource
     * @param \Magento\Framework\Data\Collection\AbstractDb|null $resourceCollection
     * @param array $data
     */
    public function __construct(
        \Magento\Framework\Model\Context $context,
        \Magento\Framework\Registry $registry,
        \Magento\Framework\Model\ResourceModel\AbstractResource $resource = null,
        \Magento\Framework\Data\Collection\AbstractDb $resourceCollection = null,
        array $data = [],
        \Magento\Catalog\Model\ResourceModel\Product\CollectionFactory $productCollection,
        \Magento\Framework\Serialize\Serializer\Json $serializer,
        \Magento\Framework\App\RequestInterface $request
    ) {
        parent::__construct($context, $registry, $resource, $resourceCollection, $data);
        $this->productCollection = $productCollection;
        $this->serializer = $serializer;
        $this->request = $request;
    }

    /**
     * Print search result
     *
     * @param bool $output
     * @return string|void
     * @throws NoSuchEntityException
     */
    public function execute()
    {
        $data = $this->serializer->unserialize($this->request->getContent());
        $low = $data['low'];
        $high = $data['high'];
        $products = [];

        if (($low || $low == 0) && $high) {
            $collection = $this->productCollection->create()
                ->addAttributeToSelect('*')
                ->addFieldToFilter('price', array(
                    'from' => $low,
                    'to' => $high
                ))->setPageSize(10);

            foreach ($collection as $product) {
                $products[] = [
                    "name" => $product->getName(),
                    "qty" => 1,
                    "price" => number_format($product->getPrice(), 2),
                    "url" => $product->getProductUrl(),
                    "thumb" => '/media/catalog/product' . $product->getThumbnail(),
                    "sku" => $product->getSku()
                ];
            }
            if (count($products)) {
                return json_encode($products);
            }
            return json_encode([
                'error' => 'No product matching the selection.'
            ]);
        }
        return json_encode([
            'error' => 'Insufficient data.'
        ]);
    }
}
