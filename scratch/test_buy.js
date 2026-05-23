const mysql = require('mysql2/promise');

const dbUrl = 'mysql://root:phantomichostjaya@185.128.227.237:3306/cynmatic_db';

async function main() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection(dbUrl);
  try {
    const userId = 'admin-001';
    const nftId = 2; // Price is 75 MCNFT

    console.log('\nStep 1: Setting user myCoinNft balance to 300');
    await connection.execute('UPDATE users SET myCoinNft = ? WHERE id = ?', ['300', userId]);
    
    // Reset NFT 2 to be for sale and owned by null
    console.log('Step 2: Resetting NFT 2 ownership & status');
    await connection.execute('UPDATE nfts SET owner_id = NULL, is_for_sale = 1 WHERE id = ?', [nftId]);

    // Query them back
    const [userRows] = await connection.execute('SELECT id, name, myCoinNft FROM users WHERE id = ?', [userId]);
    const [nftRows] = await connection.execute('SELECT * FROM nfts WHERE id = ?', [nftId]);
    
    console.log('User status:', userRows[0]);
    console.log('NFT status:', nftRows[0]);

    // Let's run the exact checks from nfts.ts route
    console.log('\n--- SIMULATING BACKEND BUY CODE ---');
    const nft = nftRows[0];
    const buyer = userRows[0];

    // Check 1: isForSale
    console.log('Check 1: isForSale =', nft.is_for_sale, 'typeof =', typeof nft.is_for_sale);
    const isForSaleBool = nft.is_for_sale === 1 || nft.is_for_sale === true || nft.is_for_sale === '1';
    if (!isForSaleBool) {
      console.log('ERROR: NFT ini tidak sedang dijual');
      return;
    } else {
      console.log('Check 1 passed!');
    }

    // Check 2: ownerId
    console.log('Check 2: ownerId =', nft.owner_id);
    if (nft.owner_id === userId) {
      console.log('ERROR: Anda sudah memiliki NFT ini');
      return;
    } else {
      console.log('Check 2 passed!');
    }

    // Check 3: balance
    const priceMcnft = Number(nft.price_mcnft || 0);
    const buyerMcnft = Number(buyer.myCoinNft || 0);
    console.log(`Check 3: Price = ${priceMcnft}, Buyer Balance = ${buyerMcnft}`);
    if (buyerMcnft < priceMcnft) {
      console.log('ERROR: Saldo MyCoinNFT tidak mencukupi');
      return;
    } else {
      console.log('Check 3 passed!');
    }

    // Step 3: perform updates
    const updatedBuyerMcnft = buyerMcnft - priceMcnft;
    console.log('Updating buyer balance to:', updatedBuyerMcnft);
    await connection.execute('UPDATE users SET myCoinNft = ? WHERE id = ?', [String(updatedBuyerMcnft), userId]);

    console.log('Updating NFT ownership and isForSale');
    await connection.execute('UPDATE nfts SET owner_id = ?, is_for_sale = 0 WHERE id = ?', [userId, nftId]);

    console.log('Success! NFT purchased in simulation.');
  } catch (error) {
    console.error('Error in simulation:', error);
  } finally {
    await connection.end();
  }
}

main();
