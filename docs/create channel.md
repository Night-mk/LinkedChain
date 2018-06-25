# **Create && Join Channel（创建并加入通道Channel）**

## **生成通道配置文件**
### **1. 使用configtxgen工具，通过configtx.yaml文件，生成通道配置文件mychannel.tx（.tx文件是程序真正可以处理的文件）**

### **2. configtxgen(Configuration Transaction Generator)工具的功能**  
* 1 生成启动Orderer需要的初始区块，支持检查区块内容
* 2 生成创建应用通道需要的配置交易，支持检查交易内容
* 3 生成锚点peer（主节点）的更新配置交易

### **3. [configtx.yaml]配置文件解析**  
 [configtx.yaml]文件主要分为四部分：
 * **Profiles** 通道配置模板（包括：Orderer系统通道模板和应用通道类型模板）
 * **Organizations** 组织结构定义，被其他部分引用
 * **Orderer** Orderer系统通道相关配置（包括：Orderer服务配置和参与Ordering服务的可用组织信息）
 * **Application** 应用通道相关配置（包括：参与应用的网络的可用组织信息）

**3.1 Profiles**  
* **Orderer系统通道模板配置**  
    * Orderer：指定Orderer系统通道自身的配置信息，包括【Ordering服务配置，参与到此Orderer的组织信息】
    * Consortiums（联合体）:Orderer所服务的联盟列表。每个联盟中组织使用相同的通道创建策略。
    ``` yaml
    TwoOrgsOrdererGenesis:
        Orderer:
            <<: *OrdererDefaults # 引入下面的Ordering服务配置，使用<<: KEY的形式引用
            Organizations:
                - *OrdererOrg # 在Organizations中定义，此处引用
        Consortiums:
            SampleConsortium: # 创建应用通道时的联盟
                Organizations:
                    - *Org1
                    - *Org2
    ```  
* **应用通道模板配置**    
    * Application：指定属于某应用通道的信息，包括【属于该应用通道的组织信息】
    * Consortium：指定应用通道关联联盟的名称
    ``` yaml
    TwoOrgsChannel:
        Consortium: SampleConsortium # 应用通道关联联盟，和上面Consortiums对应
        Application:
            <<: *ApplicationDefaults
            Organizations:
                - *Org1
                - *Org2
    ```  
**3.2 Organizations**  
* 定义一系列【组织】的结构，包括【Orderer组织】和【普通应用组织】  
    ``` yaml
    Organizations:
        - &OrdererOrg
            Name: OrdererMSP # 名称
            ID: OrdererMSP # MSP ID
            MSPDir: ../channel-artifacts/crypto-config/ordererOrganizations/example.com/msp # MSP文件路径，需要提前生成好MSP信息
            AdminPrincipal: Role.ADMIN # 组织管理员所需要的身份

        - &Org1
            Name: Org1MSP
            ID: Org1MSP
            MSPDir: ../channel-artifacts/crypto-config/peerOrganizations/org1.example.com/msp
            #【锚点】主节点地址信息，用于跨组织的Gossip通信
            AnchorPeers:
                - Host: peer0.org1.example.com
                Port: 7051

        - &Org2
            Name: Org2MSP
            ID: Org2MSP
            MSPDir: ../channel-artifacts/crypto-config/peerOrganizations/org2.example.com/msp
            AnchorPeers:
                - Host: peer0.org2.example.com
                Port: 7051

    ```
**3.3 Orderer**  
* 示例排序节点的配置
    ``` yaml
    Orderer: &OrdererDefaults
        OrdererType: solo # orderer类型，默认使用solo
        Addresses:
            - orderer.example.com:7050 # 服务地址
        BatchTimeout: 2s # 创建批量交易的最大超时，一批交易可以构建一个区块
        BatchSize:
            MaxMessageCount: 10 # 一批消息最大个数
            AbsoluteMaxBytes: 98 MB # batch最大字节数 
            PreferredMaxBytes: 512 KB # 通常情况下的batch建议字节数
        MaxChannels: 0 #ordering服务最大支持的应用通道数，默认为0，表示无限制
        Kafka: # kafka brokers 作为orderer后端
            Brokers:
                - 127.0.0.1:9092
        Organizations: # 参与维护orderer的组织，默认为空
    ```  
**3.4 Application**
* 示例应用通道相关的信息，不包括任何组织。
    ```yaml
    Application: &ApplicationDefaults
        Organizations: # 加入到通道中的组织的信息
    ```

### **4. 创建通道流程**   
**4.1 使用docker环境，配置、启动docker节点**
* 使用/e2e_cli/docker_files目录下的docker-compose-cli.yaml文件启动所需的docker节点（docker-compose配置文件解析我后面再多写一个文档），使用如下命令：
    ```powershell
    #启动节点
    docker-compose -f docker-compose-cli.yaml up
    #彻底关闭节点
    docker-compose -f docker-compose-cli.yaml down
    ```  
* 具体细节配置在/e2e_cli/docker_files/base目录下
* 启动节点有包含ca节点，目前只在org1中使用ca

**4.2 利用cryptogen工具和配置文件[crypto-config.yaml]生成MSP证书** 
* 构建crypto-config.yaml配置文件，主要作用是建立网络结构，包括构建CA，格式如下：
    ```yaml
    OrdererOrgs:
    - Name: Orderer
        Domain: example.com
        CA:
            Country: China
            Province: FuJian
            Locality: FuZhou
        Specs:
        - Hostname: orderer
    PeerOrgs:
    - Name: Org1
        Domain: org1.example.com
        EnableNodeOUs: true
        CA:
            Country: China
            Province: FuJian
            Locality: FuZhou
        Template:
            Count: 2
        Users:
            Count: 2
    ```
* 利用cryptogen工具，使用如下命令构建网络（特别注意，谨慎构建，尽量构建一次之后就不要动了，因为后续配置文件中会使用此目录的构建内容修改文件）：
    ```powershell
        cryptogen generate --config=./crypto-config.yaml --output=../channel-artifacts/crypto-config/
    ```
* 生成MSP配置文件存储于crypto-config文件夹下（包括ordererOrganizations 和 peerOrganizations）

**4.3 利用configtxgen工具和配置文件[configtx.yaml]生成channel.tx文件**  
* 生成排序服务创世区块
    ```powershell
        export FABRIC_CFG_PATH=$PWD

        configtxgen -profile TwoOrgsOrdererGenesis -outputBlock ../channel-artifacts/genesis.block
    ```
* 生成通道配置创世区块
    ```powershell
        export CHANNEL_NAME=fzuchannel #注意此处CHANNEL_NAME必须全部是小写字母
        
        configtxgen -profile TwoOrgsChannel -outputCreateChannelTx ../channel-artifacts/channel.tx -channelID $CHANNEL_NAME
    ```
* 定义组织锚节点
    ```powershell
        configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ../channel-artifacts/Org1MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org1 #注意此处的-asOrg参数是在configtx.yaml中配置的org的整体的id而不是name或者MSPID
        
        configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ../channel-artifacts/Org2MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org2MSP
    ```

**4.4 构建network-config.yaml文件**
* 文件位于/e2e_cli/config_files目录下，文件用于配置整个**网络细节**，并且和configtx.yaml、crypto-config.yaml、docker-compose-cli.yaml等文件相对应。
* 此文件用于fabric-client获取相对应的网络配置，构建fabric-client对象。此处这个文件对应于marbles项目里的connection_profile_local.json文件
    ```
        #network-config.yaml文件的描述
        The network connection profile provides client applications the information about the target blockchain network that are necessary for the applications to interact with it. These are all knowledge that must be acquired from out-of-band sources.

        网络连接配置文件为客户端应用程序提供了与应用程序交互所需的目标区块链网络信息。 这些都是必须从带外源获得的知识。
    ```
* 构建细节看具体文件（注意：只有在network-config.yaml和docker-compose-cli.yaml文件中真正定义了CA的网络配置）

**4.5 代码创建channel**
