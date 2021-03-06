# Hyperledger Fabric Functionalities（Hyperledger Fabric主要功能）  

## Identity management（身份管理）
1. Hyperledger Fabric提供了一种会员身份识别服务，管理用户ID并认证网络上的所有参与者  
2. “访问控制列表”可用于通过授权特定的网络操作来提供额外的权限层，例如：可以允许特定的用户ID调用链码应用程序，但阻止部署新的链码

## Privacy and confidentiality（隐私和保密）
1. Hyperledger Fabric使相互竞争的商业利益以及任何需要私密交易的群体能够在同一个许可的网络上共存。  
2. 专用channel是受限制的消息传递通道，可用于为特定的网络成员子集提供交易隐私和机密性。所有数据，包括交易，会员和频道信息，都是不可见的，任何非授权的网络成员都不能访问该频道。

## Efficient processing（高效处理）
1. Hyperledger Fabric按节点类型分配网络角色。为了向网络提供并发性和并行性，事务（交易）执行与事务排序和提交是分开的。在排序之前执行事务可以使每个对等节点同时处理多个事务。这种并发执行提高了每个对等体的处理效率并加速了向排序服务交付交易。  
2. 除了支持并行处理之外，分工还可以从事务执行和账本分类维护的需求中解除排序节点的负担，同时peer节点从排序（共识）工作负载中解放。角色分叉也限制了授权和认证所需的处理; 所有peer节点不必信任所有排序节点，反之亦然，所以一个节点上的进程可以独立于另一节点进行验证。

## Chaincode functionality（链码功能）  
1. 链码应用对channel上特定类型事务调用的逻辑进行编码。链码定义了资产所有权的变更参数，例如：确保所有的事务的所有转让权服遵守相同的规则和要求。
2. 系统链码是定义整个channel的操作参数的一种链码。生命周期和配置系统链码定义了通道遵循的规则，背书和验证系统链码定义了背书和验证事务的要求。

## Modular design（模块化设计）
1. Hyperledger Fabric实现了一种模块化结构，旨在为网络设计者提供功能选择。例如：对于身份、排序（共识）和加密都有特定的算法，并且可以被插入到任意的Hyperledger Fabric网络中。
2. 其结果是任何行业或者公共领域都可以采用的通用区块连架构，并确保其网络可在市场，监管和地理边界之间具有互操作性。